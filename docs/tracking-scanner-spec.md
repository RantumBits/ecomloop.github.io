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

**[v3] The first checkout step is now in scope.** It is one more navigation once
the cart has something in it, and it answers the question that matters most:
which pixels survive into checkout. Shopify checkout only runs tags installed
through its own pixel system, so a theme-installed pixel is simply absent there,
and the storefront looks fully tracked while the step where money changes hands
is invisible. Nothing is ever typed into the page. The purchase event itself
stays out of scope, and the report says so.

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

## Launch and feedback **[v3]**

The first public round is for finding wrong claims, not for finding leads. Paid
domain enrichment (Store Leads, BuiltWith, Apollo and the like) is deferred until the
scan log holds a few hundred real hosts and the question becomes who to email first.
Until then, store size from `/products.json`, theme name and detected apps are enough
to sort the list by hand.

**Gate.** Nothing is posted until the launch gate in the Testing plan passes: all
manual findings on the 10 audited stores reproduced, no false positive that would
embarrass a cold email. A wrong claim in front of a merchant forum costs more than a
week's delay.

**Where to post, in order of audience fit [v4, researched 2026-10-01]:**

Work the tiers top down. One tier per week is enough; the scan log and the
"was anything wrong" replies from one tier should be read before the next opens.
Decided 2026-10-01: Tier 1 opens the week of 2026-10-05, after the gate work
(ground-truth check on the 10 stores, feedback link, API spend limit) lands.

*Tier 1: answer existing threads (best fit).*

1. Shopify Community forums (`community.shopify.com`, boards: Ecommerce Marketing,
   Technical Q&A, Shopify Apps). Reply to existing "why is my pixel firing twice"
   threads rather than opening a launch thread. Live threads at time of writing:
   Meta pixel counting one page view as two (t/399974), Events duplication Meta
   (ecommerce-marketing/m-p/2715903), GA4 purchase firing twice in a GTM store
   (t/148983), Facebook Ads deduplication (t/401996).
2. Shopify Developer Forums (`community.shopify.dev`). Guidelines remove unsolicited
   promotion. Answer first, link when asked.
3. The official Shopify Developers Discord (~21k members). The live replacement for
   the sunset Partners Slack, with the agency and freelancer density wanted for blunt
   feedback. Same rule: help in a tracking channel, then share.
4. Talk Shop Discord (`letstalkshop.com`). Shopify builders and merchants; it also
   runs a daily newsletter that features tools.

*Tier 2: analytics practitioners (fastest false-positive finders).*

5. Measure Slack (`join.measure.chat`, ~15k+). No self-promotion culture, but
   "built this, run it on a store you know and tell me what is wrong" in a GA4 or
   GTM channel fits. Never cross-post channels.
6. Analytics Mania GTM and GA4 Facebook groups (Julius Fedorovicius). Rules allow
   GTM-related products when the post is useful. Two strikes and out, so one post
   each.
7. Analytics for Marketers Slack (Trust Insights, 4,500+ GA4 audit practitioners).
8. r/GoogleTagManager, r/GoogleAnalytics, r/PPC, r/FacebookAds. Reply to "firing
   twice" threads. Read each sidebar first; rules were not verified.

*Tier 3: merchant and DTC communities.*

9. r/shopify and r/ecommerce. Promotion-free, strictly enforced, karma gate.
   Comment replies only, never the same ask in several subs on one day. Lead with a
   redacted example report, not the URL.
10. Shopify Entrepreneurs Facebook group (HeyCarson, 100k+). Non-partners pay $250
    per promotional post, and links to services competing with HeyCarson or
    Storetasker are banned outright, which a tracking audit offer likely trips.
    Comment-only or skip.
11. eCommTalk Slack (~4k, free, Shopify-centric), Shopbrew (curated Shopify founders
    and agency partners), DTC Wonderland Discord (~1.8k, free, agencies welcome).
12. Skip: eCommerceFuel excludes agencies. Limited Supply is in-house operators
    only. Elevar's GA4 Slack is competitor-run and stale.

*Tier 4: launch directories (crashes and odd stores).*

13. Show HN and Indie Hackers. Show HN qualifies: usable in under a minute with no
    signup; three free scans before the email gate is fine.
14. Uneed, Peerlist Launchpad, BetaList, SaaSHub, AlternativeTo, Launching Next.
    Free, permanent listing, low merchant density.
15. MCP registries, only if the `/mcp` endpoint is meant to be public (the landing
    page does not mention it). Official MCP Registry first, since Glama and others
    crawl it, then Smithery.

**The ask, verbatim in every post:** "Paste your store, then tell me if any finding
is wrong." Surface false positives, not praise.

**Feedback capture.** Add a one-line "Was anything here wrong?" link under each report
that opens a mailto to the EcomLoop address with the permalink prefilled in the
subject. No form, no new storage. Replies are read against the scan log entry.

**What this round produces.** Every store that comes through lands in the scan log,
so the posting round is the real breadth check, replacing the 20 random stores in
step 4 of the Testing plan if it yields more than that. Read every report by hand,
same rule as before: a wrong claim is fixed in the detector, not the copy.

**Exit.** Revisit enrichment and outreach prioritisation once the log has a few
hundred hosts and reports have gone a week without a correction.

## Converting the log **[v4, revised after critic review 2026-10-01]**

The scan log is the lead list. This section says what a lead is, what gets sent,
when, and how we know whether any of it works. The report's rule applies to every
email: no number we would have to retract. No money-lost estimate, no score, and no
claim about ad spend beyond what the merchant told us or what is installed.

**What a log row holds today.** Timestamp, host, IP hash, email if given, result id,
finding keys and rules (raw, before personalisation), finding count, user agent.
Watch re-scans write a row with a null IP hash. Cached scans write no row.

**Five fields to add to the row.** None of these exist yet.

- `platforms`: the merchant's own answer to "which platforms do you spend on". It is
  already stored on the result document but not on the log row.
- `adVendors`: which of Meta, Google Ads, TikTok, Pinterest, Snap, Microsoft have an
  entry in the inventory. Derivable from the result; not stored as a field today.
- `apps`: tracking apps detected (Elevar, Analyzify, Littledata, Triple Whale,
  Northbeam). Today the log keeps only the bare `note-apps` key with no app name.
- `productCount`: not captured anywhere today. The products feed is fetched with a
  limit of three only to find a product URL. Add one request to
  `/products.json?limit=250` in preflight and store the length, capped at 250.
- `via`: `web`, `mcp` or `watch`. The CLI writes no log row. Needed for the skip
  rule and metric 2.

**Qualification rule.** A store is worth an email when all of these hold:

1. The scan succeeded. A row with an `error` field is not evidence.
2. The merchant named at least one platform in `platforms`, or at least one ad
   pixel is in `adVendors`. The audit's main work is reconciling purchase events
   against ad platforms, and a store with neither has little of that to do.
3. At least one finding survives personalisation with a rule other than `note`.
   Apply the same filter the report applies: a `missing-pixel` finding for a vendor
   the merchant said they do not spend on is retired to a note and does not count.
   Qualifying on raw rules would email "you have no TikTok pixel" to someone who
   said they do not run TikTok ads.
4. `productCount` is at least 50, or `apps` is non-empty. A null count means the
   feed could not be fetched (blocked, timed out, or not JSON), which is unknown,
   not zero; such a store qualifies on `apps` alone or goes to the hand pile. Both thresholds are starting
   guesses, revised after four weeks of replies.

Skip: hosts already on the outreach list, which runs on its own cadence; and rows
with `via: web` whose IP hash scanned five or more distinct hosts in a week, which
is usually an agency or a freelancer scanning clients, though a merchant with
several stores also fits. MCP rows are exempt from that test because hosted
assistants share a few egress addresses, and the hash is keyed on email only when
one is given, so one hash can be many people.

**Warm or cold.** An email given at the gate or on a watch is warm. The address was
never verified, so the opener names the host and the date rather than assuming the
reader scanned it: "Someone scanned {host} with this address on {date}." No name;
the log holds none. A row with no email is cold: it is a pre-scanned outreach
target and the email goes to the store's public contact exactly as cold outreach
already does, with the name from the store's contact or about page, or no greeting
if none is found.

**Every email, both kinds, is commercial.** The footer carries EcomLoop's postal
address and a one-line opt-out ("Reply no and I will not write again"). A "no"
goes into a Suppressed tab in the Client Acquisition Plan before anything else, and
the hand sort checks that tab first. The watch email already has an unsubscribe
link; these do not, until this is added. A watch address already receives the
watch email with its offer line, so it gets no Template A or B on top; its opener,
if ever written to directly, is "This address asked to watch {host}".

**Timing.** Within two business days of the scan. The permalink expires after 30
days and the cache lasts 24 hours, so any lead older than three weeks is
re-scanned before sending, never sent with a link about to expire.

**Send checklist.** Open the permalink and, for Template B, the proof image. The
proof route returns a 404 when no checkout screenshot was kept; drop that line if
it does. Read the finding's detail text in the report and copy its hedge; the email never
claims more than the report does.

**Template A, a pixel firing twice.** Under 120 words. Show the ID. The closing line
is the feedback ask; it need not be a question.

> Subject: {host}: Meta pixel {id} fires {times}
>
> {greeting per the rule above}
>
> On {where}, Meta pixel {id} sent {times} separate page-view events for one
> visit, so each page view reaches Meta more than once. {times} and {where} are
> taken from the finding's headline, which may say "3 times" or "2 to 3 times" and
> name the pages or "every page we checked". The copies look like they come from {sources as the report
> recorded them: theme code, Tag Manager, a Shopify sales-channel app, or "we could
> not tell where"}. The purchase event itself, and anything sent from your server,
> is what we cannot see from outside.
>
> What we saw: {permalink}
> A ticket for whoever manages your tags: {permalink}/ticket.txt
>
> Is anything in the report wrong? If you want the purchase side checked against
> your real orders as well, the audit does that: {offer link}.
>
> Andrew, ecomloop
> {postal address}. Reply no and I will not write again.

**Template B, a tag that stops at checkout.**

> Subject: {host}: {vendor} tag {id} is missing from checkout
> (when the finding names several vendors, the subject is the report headline)
>
> {greeting per the rule above}
>
> Your {vendor} tag ({id}) is on your storefront pages and absent on the first
> checkout step. Shopify's checkout only runs tags installed through its own pixel
> system, so a tag added in theme code stops at that door. Here is the checkout as
> a shopper saw it, next to the beacons that fired there: {permalink}/proof.png
>
> Report: {permalink}. Ticket: {permalink}/ticket.txt
>
> Whether the purchase event itself arrives is not something a storefront scan can
> see. That is the question the audit answers, against your orders: {offer link}.
> Tell me if we got anything wrong.
>
> Andrew, ecomloop
> {postal address}. Reply no and I will not write again.

Every other rule gets an email built from the report itself: the finding's
headline as the subject, its detail text as the first paragraph, the cause
paragraph only when the report set one (today that is the Shopify "Optimized"
explanation and nothing else), the ticket link, and a closing line that may be a
statement. The audit link is omitted from these; the report page they link to
already carries the audit CTA, and leaving it out keeps the final paragraph from
being the same shape in every send. Nothing in those is composed fresh. A store with two findings gets one
email leading with the first finding in the report, never two.

**The watch email.** It is the only recurring touch in the system and carries no
offer. Append one sentence, the same every time: "The audit traces purchases
through to your orders if you want that checked: {offer link}."

**Funnel numbers.** Four counts, read weekly from the log, written into the Client
Acquisition Plan alongside the manual outreach numbers.

1. Fresh scans that succeeded, and how many qualified under the rule above.
2. Email capture rate: `via: web` rows with an email over all `via: web` rows.
   Watch and MCP rows are excluded, and cached scans never create rows, so this
   counts first scans of a host within a day, not visits.
3. Offer-form submissions by source. This needs a site change: the offer page adds
   a hidden `source` form field filled from a `src` query parameter, and each
   link variant carries its own value (`report` for the report CTA, `warm`, `cold`,
   `watch` for the emails). Until that lands, this metric does not exist and is not
   estimated from total submissions, which all carry a URL because the field is
   required.
4. Audits booked, by the same source value.

No targets until four weeks of data exist. The first decision the numbers make is
whether the thresholds in rule 4 are too tight or too loose.

**Exit.** When the log holds a few hundred qualified hosts, the hand sort stops
scaling and paid enrichment (see Launch and feedback) is revisited to decide who
to email first.

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
- **Enrichment:** no paid domain-data APIs in v1. Deferred until the scan log has a
  few hundred hosts (see Launch and feedback).

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
