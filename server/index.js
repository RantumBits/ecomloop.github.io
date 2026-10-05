// Static site + form handling, replacing what Netlify did for free: serving
// site/, the old-Gatsby-route redirects in site/_redirects, and the two
// data-netlify forms (audit request, contact). No build step — site/ is
// served as-is, same as netlify.toml's `publish = "site"`.

import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import formbody from '@fastify/formbody';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTokenSigner, checkFields, TOKEN_FIELD } from './spam.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.join(__dirname, '..', 'site');
const PORT = Number(process.env.PORT || 8080);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_TO = process.env.NOTIFY_TO || 'drewf77@gmail.com';
const MAIL_FROM = process.env.MAIL_FROM || 'ecomloop site <site@ecomloop.com>';

// Signs the form tokens. Must be the same across instances (maxScale is 2) or
// a token minted by one is rejected by the other, so it is set from Secret
// Manager in Cloud Run. The random fallback keeps a local run working.
const FORM_SECRET = process.env.FORM_SECRET || randomBytes(32).toString('hex');
const tokens = createTokenSigner(FORM_SECRET);

const app = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' } });

// --------------------------------------------------------- old-route redirects
// Parsed from site/_redirects so that file stays the single source of truth
// (it is also what Netlify read before the migration).
function loadRedirects() {
  const raw = readFileSync(path.join(SITE_DIR, '_redirects'), 'utf8');
  const rules = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [from, to, status] = trimmed.split(/\s+/);
    if (!from || !to) continue;
    rules.push({ prefix: from.replace(/\*$/, ''), to, status: Number(status) || 301 });
  }
  return rules;
}
if (!process.env.FORM_SECRET) {
  app.log.warn('FORM_SECRET not set, using a per-process secret: form tokens will not verify across instances');
}

const redirects = loadRedirects();

app.addHook('onRequest', async (req, reply) => {
  const rule = redirects.find((r) => req.url === r.prefix.replace(/\/$/, '') || req.url.startsWith(r.prefix));
  if (rule) return reply.redirect(rule.to, rule.status);
});

// --------------------------------------------------------------- form submit
async function sendNotification({ subject, text }) {
  if (!RESEND_API_KEY) {
    app.log.warn({ subject }, 'RESEND_API_KEY not set, not sending');
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: MAIL_FROM, to: [NOTIFY_TO], subject, text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`resend ${res.status}: ${body.slice(0, 200)}`);
  }
}

await app.register(formbody);

app.post('/submit', async (req, reply) => {
  const body = req.body || {};

  // Every rejection looks exactly like a success, so the pool gets no signal
  // about which of its submissions landed and nothing to tune against.
  const pretendSuccess = (reason) => {
    req.log.info({ reason, ip: req.ip, ua: req.headers['user-agent'] }, 'form submission rejected');
    return reply.redirect('/thanks.html', 303);
  };

  // Honeypot: a bot that fills every field it can see fills this one too.
  // Kept from the Netlify markup; the current pool leaves it blank.
  if (body['bot-field']) return pretendSuccess('honeypot');

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  if (!name || !email) {
    reply.code(400);
    return 'Missing required fields.';
  }
  const formName = String(body['form-name'] || 'contact').trim();
  const url = String(body.url || '').trim();
  const source = String(body.source || '').trim();
  const message = String(body.message || '').trim();

  // The page this was submitted from was served with a signed timestamp. No
  // token, a forged one, a reused one, or one under MIN_FILL_SECONDS old means
  // this did not come from a person reading the form.
  const tokenReason = tokens.verify(body[TOKEN_FIELD]);
  if (tokenReason) return pretendSuccess(tokenReason);

  const fieldReason = checkFields({ name, email, url, message });
  if (fieldReason) return pretendSuccess(fieldReason);

  const subject = `${formName === 'audit' ? 'Audit request' : 'Contact'}: ${name}`;
  const lines = [
    `name: ${name}`,
    `email: ${email}`,
    url && `url: ${url}`,
    source && `source: ${source}`,
    '',
    message || '(no message)',
  ].filter((l) => l !== false && l !== '');

  try {
    await sendNotification({ subject, text: lines.join('\n') });
  } catch (err) {
    req.log.error({ err }, 'failed to send form notification');
  }
  return reply.redirect('/thanks.html', 303);
});

// --------------------------------------------------------- form page serving
// The form pages carry a freshly minted token, so they are rendered per
// request rather than served by fastifyStatic. Everything else in site/ is
// still served as-is.
const FORM_PAGES = { '/': 'index.html', '/index.html': 'index.html', '/offer.html': 'offer.html' };

function renderFormPage(file) {
  const html = readFileSync(path.join(SITE_DIR, file), 'utf8');
  return (token) =>
    html.replace(
      /(<input type="hidden" name="form-name"[^>]*>)/,
      `$1\n        <input type="hidden" name="${TOKEN_FIELD}" value="${token}">`,
    );
}

const formPageRenderers = new Map(
  Object.entries(FORM_PAGES).map(([route, file]) => [route, renderFormPage(file)]),
);

// Fail loudly at startup rather than silently serving a form with no token.
for (const [route, render] of formPageRenderers) {
  if (!render('probe').includes(`name="${TOKEN_FIELD}"`)) {
    throw new Error(`form token could not be injected into the page for ${route}`);
  }
}

for (const [route, render] of formPageRenderers) {
  app.get(route, async (req, reply) =>
    reply
      .type('text/html; charset=utf-8')
      // A cached page means a stale or shared token, so it must not be stored
      // by the browser or by anything between us and it.
      .header('cache-control', 'no-store, must-revalidate')
      .send(render(tokens.mint())),
  );
}

// -------------------------------------------------------------- static files
await app.register(fastifyStatic, { root: SITE_DIR, prefix: '/' });

app.setNotFoundHandler((req, reply) => {
  reply.code(404).type('text/html').send(readFileSync(path.join(SITE_DIR, '404.html')));
});

app.listen({ port: PORT, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
