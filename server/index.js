// Static site + form handling, replacing what Netlify did for free: serving
// site/, the old-Gatsby-route redirects in site/_redirects, and the two
// data-netlify forms (audit request, contact). No build step — site/ is
// served as-is.

import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import formbody from '@fastify/formbody';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createTokenSigner,
  createReceiptSigner,
  checkFields,
  TOKEN_FIELD,
  RECEIPT_FIELD,
  RECEIPT_MAX_AGE_SECONDS,
} from './spam.js';

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
const receipts = createReceiptSigner(FORM_SECRET);

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return '';
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return '';
}

// Scoped to the one page that reads it. An empty value expires it.
function receiptCookie(req, value) {
  const host = req.headers.host || '';
  const secure = req.headers['x-forwarded-proto'] === 'https' || !/^localhost(:|$)/.test(host);
  const maxAge = value ? RECEIPT_MAX_AGE_SECONDS : 0;
  return `${RECEIPT_FIELD}=${value}; Path=/thanks.html; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${
    secure ? '; Secure' : ''
  }`;
}

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

// Puts the incoming query onto a redirect target, ahead of any fragment and
// merging with a query the target already carries.
function withQuery(target, query) {
  if (!query) return target;
  const [base, hash] = target.split('#');
  const separator = base.includes('?') ? '&' : '?';
  return base + separator + query + (hash ? '#' + hash : '');
}

// Extension-less links to the landing pages (ads, social posts, outreach
// emails, etc. pointing at /offer rather than /offer.html).
const EXTENSIONLESS = ['offer', 'distributors'];
app.addHook('onRequest', async (req, reply) => {
  const [pathname, query] = req.url.split('?');
  const page = pathname.replace(/^\/|\/$/g, '');
  if (EXTENSIONLESS.includes(page)) {
    return reply.redirect(withQuery(`/${page}.html`, query), 301);
  }
});

// A 404/410 rule serves the 404 page with that status instead of redirecting:
// Google reads a redirect to an unrelated page as a soft 404 and keeps the old
// URL around, while a real 410 drops it from the index.
const GONE_BODY = readFileSync(path.join(SITE_DIR, '404.html'));

app.addHook('onRequest', async (req, reply) => {
  // Match on the path alone. req.url carries the query string, so matching on
  // it meant /posts/old?utm=x missed its rule and fell through to the generic
  // 404 — losing the 410 as well as the redirect.
  const [pathname, query] = req.url.split('?');
  const rule = redirects.find((r) => pathname === r.prefix.replace(/\/$/, '') || pathname.startsWith(r.prefix));
  if (!rule) return;
  // A gone rule serves the 404 body under its own status. There is no
  // destination, so there is nothing to carry the query onto.
  if (rule.status === 404 || rule.status === 410) {
    return reply.code(rule.status).type('text/html; charset=utf-8').send(GONE_BODY);
  }
  // Carry the query across so a gclid survives the hop and the click stays
  // attributable. Two targets end in a fragment (/#who, /#contact), and a
  // query has to go before it or it lands inside the fragment and is lost.
  return reply.redirect(withQuery(rule.to, query), rule.status);
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
  // The Shopify collaborator request code from the Tracking Fix booking form.
  // Digits only, so it can't carry anything else into the notification.
  const code = String(body.code || '').replace(/\D/g, '').slice(0, 8);
  // Which rung of the offer ladder they picked. Allow-listed rather than
  // echoed, so the notification can never carry attacker-chosen text.
  const TIERS = {
    'scan-read': 'the Scan Read ($250)',
    'ad-spend-check': 'the Ad Spend Check ($750)',
    audit: 'the Tracking & Profit Audit ($1,750)',
    watch: 'Tracking Watch ($1,750/mo)',
    'watch-testing': 'Tracking Watch + Testing ($4,000/mo)',
    unsure: 'not sure yet',
  };
  const tier = TIERS[String(body.tier || '').trim()] || '';

  // The page this was submitted from was served with a signed timestamp. No
  // token, a forged one, a reused one, or one under MIN_FILL_SECONDS old means
  // this did not come from a person reading the form.
  const tokenReason = tokens.verify(body[TOKEN_FIELD]);
  if (tokenReason) return pretendSuccess(tokenReason);

  const fieldReason = checkFields({ name, email, url, message });
  if (fieldReason) return pretendSuccess(fieldReason);

  const SUBJECTS = { audit: 'Audit request', study: 'Re-scan list', fix: 'Tracking Fix access' };
  const subject = `${SUBJECTS[formName] || 'Contact'}: ${name}`;
  const lines = [
    `name: ${name}`,
    `email: ${email}`,
    url && `url: ${url}`,
    tier && `wants: ${tier}`,
    code && `collaborator code: ${code}`,
    source && `source: ${source}`,
    '',
    message || '(no message)',
  ].filter((l) => l !== false && l !== '');

  try {
    await sendNotification({ subject, text: lines.join('\n') });
  } catch (err) {
    req.log.error({ err }, 'failed to send form notification');
  }
  // A re-scan signup is not a lead: its own page, and no receipt, so the
  // conversion tag never sees it.
  if (formName === 'study') return reply.redirect('/thanks-study.html', 303);
  // A paid Tracking Fix sending its access details: already a customer, so
  // no receipt and no conversion tag here either.
  if (formName === 'fix') return reply.redirect('/thanks-fix.html', 303);
  // The only place a receipt is issued: this submission passed every check and
  // reached sendNotification. pretendSuccess returns the same page without one.
  return reply
    .header('set-cookie', receiptCookie(req, receipts.mint()))
    .redirect('/thanks.html', 303);
});

// --------------------------------------------------------- form page serving
// The form pages carry a freshly minted token, so they are rendered per
// request rather than served by fastifyStatic. Everything else in site/ is
// still served as-is.
const FORM_PAGES = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/offer.html': 'offer.html',
  '/distributors.html': 'distributors.html',
  '/shopify-tracking-study.html': 'shopify-tracking-study.html',
  '/fix-booked.html': 'fix-booked.html',
};

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

// ------------------------------------------------------------ thank-you page
// Rendered per request so the conversion tag can be withheld. Rejections land
// here too, by design, and a tag served unconditionally would count them — plus
// every reload and bookmark — as leads that were never emailed.
const THANKS_HTML = readFileSync(path.join(SITE_DIR, 'thanks.html'), 'utf8');
const CONVERSION_BLOCK = /\n?<!-- conversion:start -->[\s\S]*?<!-- conversion:end -->/;

// Same reasoning as the form-token probe above: a silent miss here would tag
// every rejection, so fail at startup instead.
if (!CONVERSION_BLOCK.test(THANKS_HTML)) {
  throw new Error('thanks.html is missing the conversion:start/conversion:end markers');
}
const THANKS_UNTAGGED = THANKS_HTML.replace(CONVERSION_BLOCK, '');

app.get('/thanks.html', async (req, reply) =>
  reply
    .type('text/html; charset=utf-8')
    .header('cache-control', 'no-store, must-revalidate')
    // Cleared either way: a receipt is good for exactly one render, so a
    // refresh of a genuine thank-you does not count a second conversion.
    .header('set-cookie', receiptCookie(req, ''))
    .send(receipts.redeem(readCookie(req, RECEIPT_FIELD)) ? THANKS_HTML : THANKS_UNTAGGED),
);

// -------------------------------------------------------------- static files
await app.register(fastifyStatic, { root: SITE_DIR, prefix: '/' });

app.setNotFoundHandler((req, reply) => {
  reply.code(404).type('text/html').send(readFileSync(path.join(SITE_DIR, '404.html')));
});

app.listen({ port: PORT, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
