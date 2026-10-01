# EcomLoop Tracking Scanner — Build Spec v2

Revision of the original spec after review. Changes from v1 are marked **[v2]**.

## What this is

A free, public, no-login web tool: paste a Shopify store URL, get back a short
plain-language report of tracking problems (duplicate tags, double-firing pixels,
leftover cruft, missing pixels). It is the same class of defect EcomLoop already finds
by hand in cold outreach. It ends in a soft CTA to book the paid Tracking & Profit
Audit ($1,750, see `site/offer.html`).

**Standalone web tool, not a Shopify app.** No OAuth, no Partner API, no merchant login.
It visits the public storefront like any shopper would.

**[v2] It is also an internal tool.** The same scanner runs as a CLI so Andrew can
pre-scan outreach targets and paste findings and permalinks into cold emails. The CLI
and the public page are built in one push, CLI layers first, because all the risk is
in detection and the web layer is a thin wrapper over the same code.

## Why this shape

Competitors (Elevar, Littledata, Analyzify, Trackify, WeltPixel, PixelShift) all sell
subscriptions that replace or manage tracking infrastructure. EcomLoop's niche is
one-time cleanup: cruft left by a previous agency or platform switch. The tool is a
diagnostic teaser for that cleanup service, not a tracking product.

## Core feature (v1)

### Input

One field: a store URL. Normalise it (add `https://`, strip path/query, lowercase host).

**[v2] Pre-flight checks before launching a browser:**

- Resolve DNS and refuse anything that resolves to a private, loopback, link-local or
  cloud-metadata range (SSRF guard, see Abuse protection).
- Plain HTTP HEAD/GET of the homepage. Detect Shopify via any of: `X-ShopId` /
  `X-Shopify-Stage` response headers, `cdn.shopify.com` in HTML, `Shopify.shop` in
  inline script. If not Shopify, say so kindly and still run the generic scan.
- Detect a password-protected storefront (redirect to `/password`) and stop with a
  friendly message. This is the "no login walls" rule made concrete.
- Detect a bot-challenge page (Cloudflare, etc.) and stop with "we couldn't reach the
  store as a normal visitor".

### Pages scanned **[v2]**

v1 scanned only the URL given. Real findings come from product and cart pages too, and
the tone example already talks about "product pages". Scan, in order:

1. Homepage.
2. One product page. Discover it from `/products.json?limit=1` (public on every
   Shopify store) and fall back to the first `/products/` link on the homepage.
3. Cart page (`/cart`) after an add-to-cart on the product page, if the add-to-cart
   succeeds within budget. Optional in v1; skip silently if it fails.

Checkout is out of scope. It needs a real add-to-cart flow across many theme
variants and Shopify's checkout pixels behave differently. Say so in the report:
"We can only see what fires on the storefront. Purchase and checkout events are where
most stores leak, and that is what the audit covers."

### Capture (per page)

Render with **Playwright Chromium, not a plain fetch.** Most tags load through GTM
or Shopify's pixel manager after page load. This remains the #1 technical requirement.

Capture:

- Every network request (URL, method, POST body for beacons) from the page **and all
  frames**. Shopify's Web Pixels (`web-pixels-manager`, `/wpm@...`) run inside a
  sandboxed iframe, and channel-app pixels (Facebook & Instagram, Google & YouTube)
  fire from there. Listen on the BrowserContext so frame requests are not missed.
- All `<script>` tags (inline source and external `src`) from the final DOM.
- **[v2] Runtime globals**, read with `page.evaluate` after settle. These are more
  reliable than regex over HTML:
  - `google_tag_manager` keys, filtered to `GTM-`, for container IDs.
  - `window.dataLayer` entries of the form `['config', 'G-...']` / `['config', 'AW-...']`.
  - `fbq.getState().pixels` for Meta pixel IDs and their init count.
  - `ttq._i` keys for TikTok pixel IDs.
  - `Shopify.shop`, `Shopify.theme.name`, and `webPixelsManager` presence.
  - Consent state: `Shopify.customerPrivacy`, OneTrust, Pandectes, Cookiebot globals.

**[v2] Settle strategy.** Tags lazy-load on scroll, idle and interaction. Per page:
`domcontentloaded` → wait for network idle (cap 8s) → scroll to bottom in steps →
move the mouse once → wait 3s → capture. Per-page budget 20s, total scan budget 60s.
The scan therefore runs as a background job with polling, not a single blocking
request.

**[v2] Geography and consent.** Run scans from a US IP and say so in the report.
EU-targeted stores gate pixels behind consent, so a US scan sees the maximal set.
If a consent manager is detected, add one line: "Your store uses consent gating, so
some of this depends on what visitors accept."

### Detection **[v2, rewritten]**

Detectors are pure functions over the captured evidence bundle. No browser access.
This makes them unit-testable against recorded fixtures (see Testing).

Two distinct defects, both flagged separately:

- **Multiple distinct IDs** for one vendor (two GA4 properties, two GTM containers,
  two Meta pixels). Suggests leftover setup.
- **Same ID loaded or fired more than once** (one Meta pixel ID, two `init` calls,
  two `PageView` beacons on the same page). This is the most common real-world cruft
  (pixel in theme.liquid AND in GTM AND via the Shopify channel app) and v1's
  distinct-ID logic missed it entirely. Count base-code loads per ID and count
  page-view-class beacons per ID per page.

Vendor signatures for v1:

| Vendor | Base code / network signature | ID pattern | Page-view beacon |
|---|---|---|---|
| Google Tag Manager | `googletagmanager.com/gtm.js?id=` | `GTM-[A-Z0-9]+` | n/a |
| GA4 | `gtag/js?id=G-`, `google-analytics.com/g/collect`, `analytics.google.com/g/collect` | `G-[A-Z0-9]{6,}` | `en=page_view` with `tid=` |
| Google Ads | `gtag/js?id=AW-`, `googleads.g.doubleclick.net/pagead/viewthroughconversion/` | `AW-\d+` | conversion/remarketing call |
| Universal Analytics (dead) | `google-analytics.com/analytics.js`, `collect?v=1&tid=UA-` | `UA-\d+-\d+` | any hit |
| Meta Pixel | `connect.facebook.net/.../fbevents.js`, `facebook.com/tr` | `id=\d{15,16}` | `ev=PageView` |
| TikTok | `analytics.tiktok.com/i18n/pixel/events.js?sdkid=` | `sdkid=[A-Z0-9]+` | `event=Pageview` / `ViewContent` |
| Pinterest | `s.pinimg.com/ct/core.js`, `ct.pinterest.com/v3` | `tid=\d+` | `event=pagevisit` |
| Snap | `sc-static.net/scevent.min.js`, `tr.snapchat.com` | pixel id in init | `PAGE_VIEW` |
| Microsoft Ads UET | `bat.bing.com/bat.js` | `ti=\d+` | `evt=pageLoad` |
| Klaviyo | `static.klaviyo.com/onsite/js/klaviyo.js?company_id=` | company id | n/a |
| Shopify Web Pixels | `web-pixels-manager`, `/wpm@` | n/a | note presence only |
| Shopify channel apps | Meta/Google pixels fired from the `wpm` sandbox frame | same as vendor | attribute to "Shopify channel app" |
| Session recording | Hotjar, Clarity, FullStory, Lucky Orange | n/a | presence only |
| Tracking apps | Elevar, Analyzify, Littledata, Trackify, Triple Whale, Northbeam | script host | presence only, informs advice |

Ignore Shopify's own first-party analytics (`trekkie`, `monorail-edge.shopifysvc.com`,
`ShopifyAnalytics`). Every store has them and they are not a finding.

Findings, in priority order:

1. Same pixel ID initialised or page-viewed more than once on a page (Meta, GA4,
   TikTok). Say where each copy comes from when known: theme, GTM, Shopify channel app.
2. Two or more distinct GA4 properties.
3. Two or more GTM containers.
4. Two or more Meta pixel IDs.
5. Universal Analytics still loading. Dead since July 2023, pure cruft.
6. Google Ads present with no Meta pixel, or Meta present with no Google Ads.
   **[v2] Phrase as an observation, not an inference.** "We see Google Ads
   conversion tracking but no Meta pixel. If you're running Meta ads, nothing is
   measuring them." Do not claim to know their ad spend.
7. GTM present but empty (no tags fired from the container).
8. Informational: session recording, tracking apps, consent manager, theme name.
9. Clean result. Still lead to the CTA with the checkout caveat above.

### Output

A short report in EcomLoop's existing cold-email voice. Each finding is one or two
sentences: what we saw, why it matters, in plain words. Show the actual IDs.

> Your product pages load two separate GA4 properties at once (G-XXXXXXX and
> G-YYYYYYY). If both receive the same events, your reporting is inflated.

Not:

> WARNING: Duplicate analytics.js detected. Risk level: Medium.

Under the findings: a collapsed "what we saw" section listing every vendor and ID
detected per page, so the report is verifiable and looks credible.

**[v2] CTA.** Link to `https://ecomloop.com/offer.html?store=<host>#audit-contact`.
The offer page's Netlify form already has a `url` field. Add a five-line script to
`offer.html` that prefills it from the `store` query parameter.

**[v2] Result permalink.** Each scan gets a URL like `/r/<id>` that stays live for
30 days. This is what Andrew pastes into a cold email. It is not user history: no
accounts, no listing, unguessable ID.

**[v2] Email.** After the report renders, an "email me this report" field. It is
optional for the first 3 scans per IP per day and required beyond that (see Abuse
protection). Never hide a report that has already been generated.

## Explicit non-goals for v1

Do not build:

- Merchant login or accounts
- A user-facing list of past scans
- Recurring or scheduled monitoring
- Shopify OAuth or Admin API access
- Checkout scanning
- Anything installed inside a merchant's Shopify admin

## Tech stack

- **Runtime:** Node 20, plain ESM JavaScript. No TypeScript, no framework on the
  frontend. Keep the dependency list to Playwright, a small HTTP server (Fastify),
  and a rate limiter.
- **Browser:** Playwright Chromium via the official Docker image
  (`mcr.microsoft.com/playwright:v1.x-noble`). One long-lived browser, a fresh
  context per scan.
- **[v2] Architecture:** three layers with no cross-imports.
  1. `capture/` — Playwright. Input URL, output an evidence bundle (JSON) and
     optionally a HAR file.
  2. `detect/` — pure functions. Evidence bundle in, findings out. Fully unit-tested.
  3. `report/` — findings in, plain-language text and HTML out.
  A `cli.js` and a `server.js` both call the same pipeline.
- **Frontend:** one static HTML page with an input, a progress state and a results
  view. Reuse the CSS from `site/offer.html` so it looks like ecomloop.com.
- **[v2] Hosting:** GCP Cloud Run (existing account), Docker, scale-to-zero,
  1 vCPU / 2 GB, max instances 2, concurrency 1. That instance cap is the global
  abuse cap. Request timeout set to 120s. Cold start is 5 to 10s and is hidden by
  the progress screen. Vercel serverless is ruled out (Chromium bundle size, timeout
  limits). Heroku is ruled out (512 MB dynos under $50/month). Netlify cannot host it
  (static). Fly.io is the fallback if Cloud Run misbehaves.
- **[v2] Storage:** Firestore, three collections: `results` (permalinks, 30-day TTL),
  `cache` (per-host, 24-hour TTL), `scans` (the log). Cloud Run's filesystem is
  ephemeral, so no SQLite. Firestore is free at this volume.
- **[v2] Email:** Resend or Postmark free tier for "email me this report".
- **[v2] URL:** `scan.ecomloop.com`, a CNAME to the Cloud Run domain mapping.
  The marketing site on Netlify is untouched apart from the CTA prefill script.
- **[v2] Expected cost:** $0 to $5/month at a few hundred scans/month, under $10 at
  a few thousand. Marginal cost per scan beyond the free tier is roughly $0.003.

## Abuse protection (required)

- **[v2] SSRF guard.** Refuse URLs whose host resolves to private, loopback,
  link-local or metadata ranges. Re-check after redirects. Block non-http schemes.
  Run the container with no route to any internal network.
- Global concurrency cap of 2 scans (Cloud Run max instances). Queue beyond that,
  show position in the UI.
- **[v2] Email gate, not accounts.** 3 anonymous scans per IP per day. After that,
  an email address is required to scan. No verification in v1; the address goes into
  the scan log. If returning users ever matter, a magic-link email is the upgrade
  path. Never build password accounts for this.
- Hard limit: 20 scans per IP per day even with an email.
- 24-hour per-domain result cache. Repeat scans of the same store return the cached
  report instantly. This is also what makes outreach pre-scanning cheap.
- Per-page budget 20s, total 60s. Kill the context on timeout, never the browser.
- Realistic desktop Chrome user agent. Do not advertise the scanner in the UA in v1;
  it gets blocked. Revisit if a store owner complains.
- CAPTCHA only if abuse actually appears.

## Scan log **[v2]**

Every scan writes one Firestore document: timestamp, store host, findings summary,
IP hash, email if given. This is the lead list. It is not user history and is not
exposed in the UI. Andrew reviews it weekly. One line under the input: "We keep a
record of stores scanned and any email you give us so we can follow up." 

## Testing plan **[v2, expanded]**

1. **Fixture corpus.** Record a HAR plus evidence bundle for the 10 already-audited
   brands (Chamberlain Coffee, Crown Affair, Fair Harbor, Momentous, Native Pet,
   Sunski, Copper Cow Coffee, Brightland, Four Sigmatic, Maude). Commit them.
   Detectors are tested against fixtures, so the suite runs offline in under a second.
2. **Ground truth.** Encode the manual findings from the Client Acquisition Plan
   (Schedule tab) as expected findings per store.
3. **Launch gate.** The tool must reproduce every manual finding on those 10 stores
   with no false positives that would embarrass a cold email. If it does not, fix the
   detector, not the threshold.
4. **Breadth check.** Run against 20 more random Shopify stores from the outreach
   list. Read every report by hand for wrong or overconfident claims.
5. **Negative cases.** A non-Shopify site, a password-protected store, a store behind
   Cloudflare challenge, a dead domain, a private IP. Each returns a friendly message
   in under 10 seconds.

## Effort estimate **[v2]**

- CLI scanner with fixtures and validated detectors: 2 days.
- Web wrapper, queue, guards, permalinks, page: 1.5 days.
- Cloud Run deploy, subdomain, CTA prefill, breadth check: 1 day.

Call it one working week. The CLI is useful on its own after day 2.

## Decisions made

- **Hosting:** GCP Cloud Run on the existing account. Firestore for storage.
- **URL:** `scan.ecomloop.com`.
- **Logging:** store hosts and emails are logged. Privacy line under the input.
- **Gating:** 3 free scans per IP per day, then email required. No accounts.
- **Scope:** CLI and web layer in one push. Build order is still capture, detect,
  report, CLI, fixtures, then server and page, with a review checkpoint after the
  CLI reports for the 10 stores exist.

## Still to do (Andrew)

- Sign up for the free Shopify Partner Program. Costs nothing.
- Create the Cloud Run service, Firestore database, and the DNS record when the
  build reaches deploy. Claude Code cannot do these without credentials.

## Handing this to Claude Code

New repository, `ecomloop-scanner`, separate from the static site. Point Claude Code
at this file and say: "Build capture, detect, report and the CLI, record fixtures for
the 10 stores, and pause to show me the reports. Then build the server, page,
guards and email gate. Stop before deploy." Review the 10 reports by hand at the
checkpoint. Wrong claims are fixed in the detectors, not the copy.

---

# Build log (v3)

Built at `~/dev/ecomloop-scanner`, a separate repository. The CLI and the web
layer were done in one push, as decided. What follows is what changed once real
stores were in front of the detectors.

## What shipped

Capture, detect and report as three layers that never import each other
backwards, a CLI, a Fastify server, fixtures for all ten audited brands, and 34
tests. Deployment config for Cloud Run is written but nothing is deployed.

## Where the build differs from this spec, and why

1. **The reverse pixel mismatch is a note, not a finding.** The spec asked to
   flag Google Ads without Meta *and* Meta without Google Ads. Shopify installs
   a Meta pixel free through its Facebook and Instagram channel, so a Meta pixel
   is weak evidence of any ad spend. Flagging it would nag most stores for
   nothing. Google Ads without Meta is still a finding, because a Google Ads
   conversion tag is always deliberate.

2. **Duplicate-firing findings are grouped per vendor and ID, not per page.**
   Reported per page, Crown Affair produced eight findings that were really
   five problems, and it read like padding.

3. **Two Klaviyo accounts is now a finding.** Crown Affair has two. Split
   browsing and signup data is the same leftover-agency problem as two GA4
   properties.

4. **A bot check is only believed when the real browser hits it.** The plain
   pre-flight fetch has no browser fingerprint, so bot protection blocks it far
   more often than it blocks Chromium. Three of the ten brands were refused on
   that basis and scanned fine once the refusal moved to the rendered page.

5. **The cart page is reached by an AJAX add, not a cart permalink.** The
   `/cart/<variant>:1` permalink now redirects straight to checkout on many
   stores. Any redirect into `/checkouts/` aborts that page, since checkout is
   out of scope.

6. **New finding: tags configured but silent.** Chamberlain Coffee has GA4, GTM,
   Meta and TikTok configured and a CookieYes banner that blocks all of them.
   Reporting that store as clean would have been the most misleading thing the
   tool could do.

## Two capture details that the detectors depend on

Both were wrong in the first working version and produced false negatives that
looked exactly like clean stores.

- **The Meta pixel posts to `/tr/` with no query string.** The pixel ID and the
  event name are in a multipart form body. Reading only the URL finds nothing.
- **Shopify's web pixel frame is served from the store's own origin** at
  `/web-pixels@<id>`, not from a URL containing `web-pixels-manager`. Requests
  have to be recorded on the browser context, not the page, and attributed by
  that frame URL. This is what lets a report say which copy of a doubled tag
  comes from a sales-channel app.

## Results across the ten audited brands

Five have findings: Crown Affair, Fair Harbor, Copper Cow Coffee, Four Sigmatic
and Maude. Five look clean from outside: Chamberlain Coffee, Momentous, Native
Pet, Sunski and Brightland. None were refused.

## The launch gate is not met yet

The spec says the tool must reproduce the manual findings documented in the
Client Acquisition Plan (Schedule tab) before it goes public. That document was
not available during the build, so the comparison has not been done. Reading
those ten reports against the manual notes is the next step, and it is Andrew's,
not the build's.

## Bugs found in review and fixed

Seven, ranked by how badly they would have bitten.

1. **Attribution blamed the theme for tags it did not own.** It searched the
   rendered DOM, which Tag Manager injects into, so everything looked
   hard-coded. It now reads the document as the server sent it. Confirmed
   wrong on live stores before the fix.
2. **Evidence exceeded Firestore's 1 MiB document limit** on four of ten
   stores, so permalinks would have failed outright. Stored bundles are now
   reduced to the requests detection reads.
3. **The rate limit was silently disabled in production.** Counting the scan
   log needed a composite index nobody had created; the query threw and the
   swallowed throw read as "no scans yet". It now reads a counter document and
   fails closed.
4. **The client address was spoofable**, so one header reset anyone's quota.
5. **Deployment ran the in-memory job queue across two instances**, left CPU
   throttled while scans run after their request returns, and queued progress
   polls behind the scan they polled.
6. **A missing-pixel finding could fire while consent gating held every tag
   back**, telling a store it had no Meta pixel when it had one.
7. **Nothing waiting on a page had a time ceiling.** Reading a response body
   and `page.evaluate` both block forever on a slow store, so one store could
   hold a scan slot open indefinitely.

## Before it can go live

- Compare the ten reports against the manual findings. Fix detectors, not
  thresholds.
- Create the Cloud Run service and Firestore database, set a real `IP_SALT`
  secret, add a TTL policy on `expiresAt`, then run `./deploy.sh`.
- Point `scan.ecomloop.com` at the Cloud Run domain mapping.
- Run the breadth check on twenty more stores from the outreach list and read
  every report by hand.
