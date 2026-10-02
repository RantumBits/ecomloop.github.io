// Static site + form handling, replacing what Netlify did for free: serving
// site/, the old-Gatsby-route redirects in site/_redirects, and the two
// data-netlify forms (audit request, contact). No build step — site/ is
// served as-is, same as netlify.toml's `publish = "site"`.

import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import formbody from '@fastify/formbody';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.join(__dirname, '..', 'site');
const PORT = Number(process.env.PORT || 8080);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_TO = process.env.NOTIFY_TO || 'drewf77@gmail.com';
const MAIL_FROM = process.env.MAIL_FROM || 'ecomloop site <site@ecomloop.com>';

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
  // Honeypot: bots fill every field, including the one hidden from people.
  // Pretend success so the bot doesn't learn to leave it blank.
  if (body['bot-field']) return reply.redirect('/thanks.html', 303);

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

// -------------------------------------------------------------- static files
await app.register(fastifyStatic, { root: SITE_DIR, prefix: '/' });

app.setNotFoundHandler((req, reply) => {
  reply.code(404).type('text/html').send(readFileSync(path.join(SITE_DIR, '404.html')));
});

app.listen({ port: PORT, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
