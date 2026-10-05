// Spam protection for the two contact forms, replacing what Netlify's own
// filtering did before the Cloud Run migration.
//
// The attack this is built against (observed Oct 2-5 2026, 20 submissions in
// three days, zero genuine leads): a bot pool fetches /contact/ -> / , parses
// the HTML, fills the visible fields and POSTs /submit 0.3-1.2s later. Every
// IP is used roughly once, the Referer is spoofed to https://ecomloop.com/,
// and the User-Agent is a plausible desktop Chrome. Nothing but the HTML is
// ever requested: no CSS, no fonts, no images, so no JavaScript runs.
//
// That rules out the cheap defences. Referer and User-Agent are attacker
// controlled, per-IP rate limiting has nothing to count, and the `bot-field`
// honeypot the Netlify markup already carried is deliberately left blank.
//
// What the pool cannot fake is the clock. A person who reads the page and
// types a name, an email, a URL and a sentence takes longer than a second.
// So every form page is served with a hidden token carrying a signed,
// server-issued timestamp, and /submit requires that token to be ours, to be
// old enough, not to be stale, and not to have been used before.

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// A person has to read the page and type into it. The fastest of the 20 bot
// submissions turned round in 0.3s and the slowest in 1.2s; genuine completion
// of four fields is far longer, so this leaves plenty of headroom either way.
export const MIN_FILL_SECONDS = 4;
// Long enough that a tab left open over lunch still submits, short enough that
// a token scraped for later reuse expires.
export const MAX_FILL_SECONDS = 6 * 60 * 60;

export const TOKEN_FIELD = 'ff';

// Tokens are single-use. Keyed by nonce, holding the expiry so the sweep can
// drop entries once no valid token could still carry them.
const spentNonces = new Map();

function sweepSpentNonces(now) {
  for (const [nonce, expiresAt] of spentNonces) {
    if (expiresAt <= now) spentNonces.delete(nonce);
  }
}

export function createTokenSigner(secret) {
  const sign = (payload) => createHmac('sha256', secret).update(payload).digest('base64url');

  return {
    // `ts.nonce.signature`, safe to embed in HTML and to hand to a bot: it is
    // only valid for one submission, in one time window.
    mint(now = Date.now()) {
      const payload = `${Math.floor(now / 1000)}.${randomBytes(9).toString('base64url')}`;
      return `${payload}.${sign(payload)}`;
    },

    // Returns null when the token is good, otherwise a short reason to log.
    verify(token, now = Date.now()) {
      if (typeof token !== 'string' || !token) return 'token-missing';

      const lastDot = token.lastIndexOf('.');
      if (lastDot < 0) return 'token-malformed';
      const payload = token.slice(0, lastDot);
      const presented = Buffer.from(token.slice(lastDot + 1), 'base64url');
      const expected = Buffer.from(sign(payload), 'base64url');
      if (presented.length !== expected.length) return 'token-bad-signature';
      if (!timingSafeEqual(presented, expected)) return 'token-bad-signature';

      const [issuedAtRaw, nonce] = payload.split('.');
      const issuedAt = Number(issuedAtRaw);
      if (!Number.isFinite(issuedAt) || !nonce) return 'token-malformed';

      const ageSeconds = now / 1000 - issuedAt;
      // A token from the future is either a replay against a clock skew or a
      // forgery; either way it is not a person filling in a form.
      if (ageSeconds < MIN_FILL_SECONDS) return 'too-fast';
      if (ageSeconds > MAX_FILL_SECONDS) return 'token-expired';

      sweepSpentNonces(now);
      if (spentNonces.has(nonce)) return 'token-reused';
      spentNonces.set(nonce, now + MAX_FILL_SECONDS * 1000);

      return null;
    },
  };
}

// Caps that a genuine lead stays well inside. These are a second line behind
// the token, aimed at the shapes actually seen in the 20 submissions rather
// than at wording, which is cheap for a bot to vary and risks real leads.
const MAX_NAME = 120;
const MAX_EMAIL = 254; // RFC 5321 maximum length of a forward path
const MAX_URL = 500;
const MAX_MESSAGE = 4000;
const MAX_MESSAGE_LINKS = 3;

const SINGLE_EMAIL = /^[^\s@,;<>()[\]]+@[^\s@,;<>()[\]]+\.[^\s@,;<>()[\]]{2,}$/;

// Returns null when the fields look like a person, otherwise a reason to log.
export function checkFields({ name, email, url, message }) {
  if (name.length > MAX_NAME) return 'name-too-long';
  if (email.length > MAX_EMAIL) return 'email-too-long';
  if (url.length > MAX_URL) return 'url-too-long';
  if (message.length > MAX_MESSAGE) return 'message-too-long';

  // One submission put five harvested addresses in the email field. The form
  // asks for one address and the notification is only useful with one.
  if (!SINGLE_EMAIL.test(email)) return 'email-not-single-address';

  // A name is not a place to advertise.
  if (/https?:\/\/|www\./i.test(name)) return 'link-in-name';

  const links = message.match(/https?:\/\/|www\./gi);
  if (links && links.length > MAX_MESSAGE_LINKS) return 'too-many-links';

  // Newlines in a single-line field mean a crafted payload, most often an
  // attempt to inject extra headers into the notification mail.
  if (/[\r\n]/.test(name) || /[\r\n]/.test(email) || /[\r\n]/.test(url)) return 'newline-in-field';

  return null;
}
