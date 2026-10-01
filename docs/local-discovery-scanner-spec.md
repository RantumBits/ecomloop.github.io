# Local Business Discovery Scanner — Build Spec v2 (parked 2026-10-01)

Companion to `docs/tracking-scanner-spec.md` (Shopify Tracking Scanner, on branch
`claude/shopify-tracking-scanner-spec-10c07b`). Same architecture, same business model,
different defect class and a different audience.

Revision after a critic pass on v1. Changes are marked **[v2]**. The large ones: a
prevalence survey now precedes the build and carries a kill threshold; the positioning
claim that incumbents do not cover AI visibility was false and is replaced; the two
AI-access checks are merged and their confidence ordering reversed; service-area
businesses are handled; both cost figures were wrong and are re-derived with sources.

## [Outcome — 2026-10-01] Parked. Discoverability folded into the Shopify scanner.

Step 0 ran on 826 local business websites; full results in `docs/step0-results.md`. The
searcher-journey framing and the email-gate exchange that came out of this work moved to
the DTC audience as a profile of the tracking scanner: `docs/shopify-discoverability-spec.md`.
The local version stays specced here in case a reason to build it appears. The Step 0
numbers that led to that decision:

- **Strict composite: 15.5–18.4%** of reachable sites depending on definition (18.4% as the
  spec defined it; 15.5% with schema conflicts hand-verified; 16.9% adding robots.txt
  blocks) — inside the gray zone, not above the 25% build line.
- **The AI-crawler check (A1) fires on 3.9% of sites.** One site in 641 named a citation
  bot in robots.txt. Cloudflare-fronted sites blocked GPTBot (24 of 214) and served
  OAI-SearchBot and PerplexityBot in all but 5 cases: the toggles in the wild block
  training and leave citation alone, which is correct behaviour. The claim below that
  Cloudflare's default blocks citation bots was not observed in this sample; the sample
  is of unknown zone age, so it does not test the post-July-2025 default directly.
- **Conflicting schema is 1.9%**, not 5%; most two-entity sites are legitimate
  multi-location businesses and the detector must not flag them.
- **What is common:** domains that do not resolve or fail TLS (~8% of listings, stale-data
  inflated),
  pages empty without JavaScript (3–5%), phone or address absent from visible text
  (23–29%). That is a website-readability grader — the product this spec said not to
  build — and it clusters in cafes, salons and bakeries.
- **One sharp vertical finding:** agency-caused schema conflicts in dental and accounting
  practices (5 of 31 dentists sampled — a lead, not a rate), including a call-tracking
  number leaked into the structured data. Closest thing in the data to the Shopify defect
  class.

The rest of this document is kept as the record of what was going to be built and why.
The checks are still correct as checks. Tier D (assistant accuracy) was not measured and
is the one AI finding Step 0 leaves open. Two alternative directions are set out at the
end of the results document.

## What this is

A free, public, no-login web tool: paste a local business's website (or its name and
city), get back a short plain-language report on whether the business can be found and
described correctly by Google Maps, Google Search, and AI assistants. It ends in a soft
CTA to a fixed-price one-time cleanup engagement.

Like the tracking scanner, it is also an internal tool: the same pipeline runs as a CLI
so a target can be pre-scanned and the findings plus a permalink used in outreach.

## Why this shape

The tracking scanner works as lead gen because it finds a defect that is verifiable,
caused by past neglect, and fixable once. Local discovery has a close analogue, with one
difference stated below: a business whose site blocks the crawlers that would cite it,
whose phone number exists only inside a JavaScript widget, and whose Google listing still
says "temporarily closed." All three are one-time fixes.

**[v2] The incumbents already sell AI visibility.** v1 claimed otherwise and was wrong.
[BrightLocal ships a Local AI Visibility tracker](https://www.brightlocal.com/local-seo-tools/local-ai-visibility/)
covering AI Overviews, AI Mode and ChatGPT;
[Yext Scout covers ChatGPT, Gemini, Perplexity and AIO across 20 competitors per location, and Semrush tracks seven engines](https://searchengineland.com/guide/how-ai-is-impacting-local-search).
What they sell is subscription monitoring: a dashboard of where you appear, month after
month. What none of them sells is the thing the Shopify spec also identifies as the gap:
a free, one-shot diagnosis that names the **cause** (your host blocks the citation
crawlers; your hours are an image) and a one-time fix for it. Same niche as the tracking
cleanup, one category over, and it has to be earned the same way, by a finding the reader
can verify.

**The difference from the Shopify case, stated plainly.** A duplicate Purchase event has a
dollar figure attached: misattributed ad spend. AI invisibility for a local business does
not. Nobody can tell a plumber what being absent from ChatGPT costs per month, and this
report should not pretend to. The offer leans on concrete, felt errors instead: "two
assistants told people you close at 5; you close at 7." That is weaker than "here is what
your tracking is costing you," and the price has to reflect it.

The "free local SEO grader" category is saturated and low-trust — BrightLocal, Whitespark,
Moz Local, Semrush and Yext all ship one, plus agency lead-magnet graders that produce the
same red/yellow/green sheet. A score-out-of-100 tool joins that pile. Google Business
Profile and Maps checks are the supporting layer here; the cause-finding AI-access and
machine-readability checks lead.

**[v2] Channel is undecided.** v1 assumed "paste into cold
email." Local owners' addresses are often unpublished or a personal Gmail, and the
audience is heavily solicited. Candidate channels: the listing's phone number, a mailed
one-pager with the permalink, or web designers and small agencies who serve local
businesses and could run the scan on their clients. Decide before building; it changes
what the report needs to look like.

## [v2] Step 0 — prevalence survey, before any build

v1 called the AI-crawler check "the headline" with no evidence of how often it fires. The
only published number is for large sites: OAI-SearchBot refused at the edge on
[20 of 2,400 Tranco top-5k domains, PerplexityBot on 48 of 2,311](https://dev.to/reesecalder/cloudflare-dropped-the-ai-bot-lines-from-robotstxt-on-sept-15-most-of-those-sites-still-refuse-5fc6)
— under 2%. Local SMB sites are a different population and nobody has measured them.

Half a day, one script, 300–500 local business sites from a real outreach list, not a
top-sites list. For each site record:

- robots.txt disallows for the citation and user-fetch tokens (see A1)
- edge response to AI user agents using the two-control method (see A1)
- `server`/`cf-ray` headers, i.e. Cloudflare-fronted or not
- phone number present as text in raw HTML; `tel:` link present
- street address present as text in raw HTML
- a `LocalBusiness` JSON-LD block present; more than one present
- builder fingerprint (Squarespace, Wix, GoDaddy, WordPress, other)

**Kill threshold, written down now:** if fewer than 10% of sites have at least one of
{citation-bot block at the edge, phone absent from raw HTML, conflicting schema}, the
AI-discovery angle does not carry a free tool and this becomes a local grader. Stop
there. If 25%+ have one, build. In between, read the fixtures and decide.

This also settles which of the two AI-access evidence paths matters (robots.txt vs.
edge), which v1 guessed at and guessed backwards.

## Input

Two accepted forms, because local businesses are not reliably identified by a domain:

1. A website URL (preferred). Normalise as in the tracking scanner.
2. A business name plus city, for businesses with no site or an unfindable one.

**Matching the Google listing is the main source of wrong reports.** Resolve candidates
via Places Text Search **[v2] with `includePureServiceAreaBusinesses: true`** — the default
excludes service-area businesses, which means v1 would have reported every plumber,
cleaner and electrician without a storefront as having no listing
([Text Search docs](https://developers.google.com/maps/documentation/places/web-service/text-search)).
Then require a corroborating match before claiming it is them: the Place's `websiteUri`
host equals the input host, OR its phone matches a phone found on the site. If neither
holds, show the top three candidates with address and let the user pick. Never silently
pick the first result.

**[v2] "No Google listing found" means our match failed, and the report says so.**
It fires only after the SAB-inclusive search, a name+city retry, and no candidate within
the same city. The report wording is "we couldn't find a Google listing that matches your
website or phone number," with the candidates we did see. A false "you have no listing"
is as damaging as matching the wrong business.

## Checks

Ordered by cost and confidence. Tier A is free, deterministic, instant, and has no terms
exposure. **One rule for every tier, stated once:** the report claims only what the
evidence shows, names what it cannot see, and never scores.

### Tier A — plain HTTP, free, deterministic

**A1. AI agent access. [v2] Merged from v1's A1 and A2, with confidence re-ordered.**

Two evidence sources, read together:

*Source 1 — `robots.txt`.* AI user-agent tokens split three ways, and the split is the
finding:

| Class | Tokens | Treatment |
|---|---|---|
| Training | `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `meta-externalagent`, `CCBot`, `Bytespider`, `Amazonbot` | Informational. Opting out of training is a legitimate choice and not a defect. |
| Search / citation | `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot` | Finding. OpenAI's own wording: ["Sites that are opted out of OAI-SearchBot will not be shown in ChatGPT search answers."](https://developers.openai.com/api/docs/bots) |
| User-triggered fetch | `ChatGPT-User`, `Claude-User`, `Perplexity-User` | Finding. This is the live fetch when a customer asks about them. |

Also flag `Disallow: /` under `User-agent: *`, a robots.txt that returns HTML or a soft
404, and conflicting group precedence.

**[v2] Expect this source to be quiet on builders.**
[Squarespace's "Block known artificial intelligence crawlers" toggle is off by default and controls 26 training bots; none of OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Claude-SearchBot or Claude-User is on its list](https://squareranked.com/squarespace-ai-search/ai-crawlers/),
and [Squarespace users cannot edit robots.txt directly](https://www.squareko.com/website-and-seo/squarespace-robots-txt-edit).
So on Squarespace, a robots.txt citation block essentially cannot happen. Wix has a
robots.txt editor and no AI toggle.

*Source 2 — edge response, two-control method.* Fetch the homepage three times: a normal
Chrome UA, a `Googlebot` UA, and the target AI UA (`OAI-SearchBot`, then `ChatGPT-User`).
A site that refuses the AI UA **while serving both controls** is blocking AI agents
specifically. A site that refuses both controls is inconclusive and is not reported. This
is the method the dev.to analysis above used and it removes most of the false-positive
case v1 worried about.

**[v2] The common defect is at the edge, where robots.txt cannot see it.** *[Step 0: not observed — see outcome section at top; among 214 Cloudflare-fronted local sites with controls served, 24 blocked GPTBot only and 5 refused a citation bot. Zone age unknown, so not a direct test of the new-zone default.]* Since 1 July 2025
[every new Cloudflare zone blocks AI crawlers by default via a managed WAF rule, and that rule does not distinguish training from retrieval — it blocks OAI-SearchBot and PerplexityBot along with GPTBot](https://llmrefs.com/blog/cloudflare-blocks-ai-crawlers).
Cloudflare [retired the managed robots.txt that used to surface those blocks in the file](https://dev.to/reesecalder/cloudflare-dropped-the-ai-bot-lines-from-robotstxt-on-sept-15-most-of-those-sites-still-refuse-5fc6),
so robots.txt looks clean while the edge returns 403. Nothing in the business owner's
control panel told them this happened.

Confidence, by evidence combination:

| Evidence | Confidence | Report wording |
|---|---|---|
| robots.txt disallows a citation or user-fetch token | Certain | State it, quote the lines. |
| AI UA gets 403, both controls 200, `server: cloudflare` present | High | "Your host, Cloudflare, is blocking AI search agents at the edge. This is its default for sites set up since July 2025. It is one setting: Security → Bots → Block AI bots (or AI Crawl Control)." |
| AI UA gets 403, both controls 200, not Cloudflare | Medium | "Requests identifying as AI search agents were refused while normal visitors were served. Worth checking your host's bot settings." Not a headline finding on its own. |
| Both controls also refused | None | Not reported. |

The residual false positive — a site that verifies bots by IP and correctly refuses our
spoofed UA — is a configuration a single-location business does not have. State it in
the methodology section anyway.

**Fixability, which the offer depends on.** Cloudflare: one dashboard toggle, a
same-day fix. Wix: edit robots.txt in the SEO dashboard. Squarespace: the robots.txt path
does not apply; if a Squarespace site is edge-blocking it is Squarespace's doing and the
owner cannot change it — say so rather than selling a fix that does not exist.

**A2. Is the business machine-readable at all?** (v1's A3.) Fetch raw HTML with no
JavaScript and look for, as text: the phone number and a `tel:` link; the street address
and city; business hours. Sites that render these through a JS widget, bake them into a
hero image, or leave the address only inside a Maps iframe give a crawler nothing to read.
Deterministic. **[v2]** Prevalence unknown until Step 0; v1's "a large share" was a guess.
For a service-area business the address check is skipped — they have none to publish.

**A3. LocalBusiness structured data.** (v1's A4.) Parse JSON-LD, microdata and RDFa from
raw HTML. Check for `LocalBusiness` or a subtype and field completeness: `name`, `address`
as a `PostalAddress` rather than a string, `telephone`, `geo`, `url`,
`openingHoursSpecification`, `image`, `sameAs`, `priceRange`.

Two separate flags, mirroring the tracking scanner's two-defect split:
- Missing or incomplete schema.
- Multiple conflicting `LocalBusiness` entities, typically two SEO plugins each emitting
  one with different addresses or phones. Same class as two GA4 properties: nobody chose
  it.

**A4. Indexability and mobile fundamentals.** (v1's A5.) `noindex` meta or header,
canonical pointing off-site, HTTPS and certificate validity, HTTP→HTTPS redirect, www
canonicalisation, `sitemap.xml` present and referenced from robots.txt, viewport meta,
`<title>` and meta description present and containing a locality term.

**A5. `llms.txt`** — presence only, informational. It is a proposed convention with no
confirmed adoption by the major assistants. Not a ranking factor and the report does not
call it one.

### Tier B — Google Places API (New): the supporting layer

Text Search to locate, Place Details for the record.

**[v2] SKU correction.** v1 said "Pro rates, 5,000 free/month." Wrong. `nationalPhoneNumber`,
`websiteUri`, `regularOpeningHours`, `rating` and `userRatingCount` are all
[Enterprise SKU fields, and a request is billed at the highest SKU in its field mask](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing).
Enterprise is $20/1k for Details with 1,000 free calls a month per SKU, not 5,000. Keep
`editorialSummary` and `reviews` out of the mask unless needed; they push the request to
Enterprise + Atmosphere.

Fields: `id`, `displayName`, `formattedAddress`, `nationalPhoneNumber`, `websiteUri`,
`regularOpeningHours`, `rating`, `userRatingCount`, `businessStatus`, `primaryType`,
`pureServiceAreaBusiness`, `photos`, `googleMapsUri`.

Findings, in priority order:

1. **No matching listing found** — under the matching rules above, with candidates shown.
2. **`businessStatus` is not `OPERATIONAL`.** A stale "temporarily closed" flag is turning
   customers away now.
3. **No `websiteUri`, or it points somewhere dead**: an old domain, a Facebook page, a
   parked page.
4. **NAP mismatch between listing and site**, cross-referenced against A2. **[v2]** Phone
   only for a service-area business.
5. **No `regularOpeningHours`.**
6. **Review volume against the local set.** A second Text Search for the same
   `primaryType`. **[v2]** For storefront businesses, within a radius scaled to the
   locality (a fixed "two miles" is meaningless for a rural business); for service-area
   businesses, within the listing's city. Take the top ~10, report the median. "The eight
   other [category] serving [city] have a median of 180 reviews. You have 12." Concrete
   and the reader can check it.
7. Thin photo set.

**What the Places API cannot tell us, and the report does not imply:** claimed or verified
status, Posts recency, Q&A state, review response rate, profile attributes, categories
beyond the primary type, and any insights. Those need
[Business Profile API access, which requires an approval gate plus owner-level OAuth on the business's own account](https://developers.google.com/my-business/content/locations-setup)
— impossible for cold scanning. Scraping the Maps UI for "Claim this business" is against
Google's terms and brittle; do not.

### Tier C — other maps and directories: not economical in v1

- **Apple Maps / Business Connect.** Matters for iPhone and Siri. The Apple Maps Server
  API needs an Apple Developer Program membership ($99/yr). v2, contingent on that.
- **Bing Places.** No clean public lookup API; the Webmaster API needs site ownership. v2
  at best.
- **Yelp.** `is_claimed` would be useful, but
  [Fusion no longer has a free tier: about $7.99 per 1,000 calls on the cheapest pay-per-call plan, or $229/month](https://appdevelopermagazine.com/yelp-fusion-api-outrageous-new-pricing/).
  Too expensive for a free public tool. Keep it as a manual CLI flag for a qualified
  prospect, where $0.008 a lookup is irrelevant.
- **Facebook Page data.** Graph API gating makes this not worth it. Skip.

The report says this is not a 50-directory citation audit, which is what BrightLocal sells.

### Tier D — what AI assistants say (the differentiator, and the cost)

Build a prompt set from the business's own category and locality, derived from Places
data. Five to seven prompts, templated per category, plus one direct-name prompt:

- "Who are the best [category] in [city, state]?"
- "I need an emergency [category] in [city] tonight — who should I call?"
- "What [category] in [city] do [common service]?"
- "Tell me about [Business Name] in [city]." Always answerable, and usually where the
  errors surface.

Run across two or three model APIs with web search enabled: Anthropic with the web search
tool, OpenAI's API with search, Perplexity's Sonar API.

**What this measures.** Search-grounded model APIs, not the consumer ChatGPT app, which
has its own retrieval stack and personalisation. Driving the consumer products
programmatically is outside their terms, and their answers differ. The report says which
one it tested.

Record verbatim: whether the business is named, whether it is cited with a link to its own
domain, which competitors appear instead, and anything the model states about them that
is wrong. "We asked three assistants about you. Two said you close at 5pm. Your Google
listing says 7pm. One listed your old phone number." Each wrong statement traces back to
A2 or A3, which is what makes it fixable.

**Raw, never scored.** An appearance tally ("named in 2 of 7 prompts"), the exact prompts,
the date, the verbatim excerpts. No 0–100 "AI Visibility Score": results vary between
runs, a score implies a precision that does not exist, and a competitor re-running it to a
different number ends the conversation. A "run it again" button that shows the variance is
better than a fake-stable number.

**[v2] Cost, re-derived.** v1 said $0.05–0.20 per scan. Wrong by several times.
[Anthropic web search is $10 per 1,000 searches plus tokens](https://www.anthropic.com/news/web-search-api);
[OpenAI is $25 per 1,000 calls on non-reasoning models and $10 on reasoning models, plus search-context tokens](https://www.modelcostwatch.com/openai/tool-costs/web-search);
[Perplexity Sonar is $5–12 per 1,000 requests plus $1/M tokens](https://www.cloudzero.com/blog/perplexity-api-pricing/).
A prompt that triggers one or two searches costs $0.02–0.05 per provider. Seven prompts
across three providers is **$0.25–0.75 per scan**, and Tier D is where almost all the
money goes.

## Output

Same voice as the tracking scanner and `site/offer.html`. One or two sentences per
finding: what we saw, why it matters, in plain words, with the real values.

> Your host is blocking the crawlers that let ChatGPT and Perplexity cite you. Requests
> from `OAI-SearchBot` and `PerplexityBot` get a 403 from Cloudflare while normal visitors
> get the page. Cloudflare turned this on by default for sites set up after July 2025;
> it is one setting to change.

Not:

> WARNING: AI Crawler Accessibility Score: 34/100. Risk level: High.

Below the findings, a collapsed "what we saw" section: every check run, every raw value,
the three-UA responses, the exact prompts and model responses, the scan date, and that
scans run from a US IP. Every line verifiable.

## The offer this feeds

The paid engagement has to be a concrete one-time fix, as the tracking audit is:

- unblock the citation and user-fetch crawlers (Cloudflare toggle, Wix robots.txt; on
  Squarespace, explain the limit instead of promising)
- put NAP and hours into server-rendered HTML with valid `LocalBusiness` schema
- fix the Google listing: status, hours, website, categories, description, photos
- correct what the assistants currently get wrong, and re-test
- set up review generation

**Price for this audience.** $1,750 fits a Shopify brand burning ad spend against bad
attribution. A single-location local business will not pay it, and this offer cannot
attach a dollar figure to the defect the way the tracking audit can. Materially lower,
or a volume product. Andrew's call, made before the CTA copy is written.

## Explicit non-goals for v1

- Keyword rank tracking and SERP position. Clean rank data means a paid SERP API
  (SerpApi, DataForSEO) at real per-query cost; scraping Google directly is against terms
  and unreliable. The report does not imply it has rank data.
- A 50-directory citation audit.
- Claimed/verified status detection. Not obtainable. See Tier B.
- Accounts, user-facing scan history, recurring monitoring.
- Review sentiment analysis.
- Anything requiring the business owner to log in to anything.

## Tech stack

The tracking scanner's architecture transfers nearly unchanged. **[v2]** Reuse makes this
cheap to build. Step 0 decides whether to build it.

- **Runtime:** Node 20, plain ESM. Fastify, a rate limiter.
- **Three layers, no cross-imports.** `capture/` (HTTP fetches, Places calls, model calls
  → evidence bundle JSON), `detect/` (pure functions, bundle in, findings out, unit-tested
  against fixtures), `report/` (findings in, text and HTML out). `cli.js` and `server.js`
  call the same pipeline.
- **No browser for Tiers A–C.** Plain HTTP and JSON APIs. Cheaper, faster, and less
  fragile than the Playwright-based Shopify scanner. A headless render can be added later
  to compare rendered vs. raw DOM for A2; the raw fetch alone flags the defect.
- **Hosting:** Cloud Run, as the tracking scanner. Firestore with the same three
  collections (`results` 30-day TTL, `cache` 24-hour TTL, `scans` as the lead log).
- **Shared core:** if both tools ship, one monorepo with a common `core/` for server,
  queue, guards, permalinks, email and report shell. Detectors and capture stay separate.
- **URL:** a sibling subdomain, e.g. `local.ecomloop.com`.

## Cost model **[v2, corrected]**

The tracking scanner is about $0.003 a scan. This one is not close to that.

| Component | Per scan | Free allowance |
|---|---|---|
| Tier A | $0 | — |
| Places: Text Search (find, Enterprise for `websiteUri`/phone) + Details (Enterprise) + Text Search (competitors, Enterprise for `userRatingCount`) | ~$0.06–0.09 | 1,000 calls/month per Enterprise SKU |
| Tier D model calls, 7 prompts × 3 providers | $0.25–0.75 | none |

**$0.35–0.85 per scan.** At 1,000 scans a month that is $350–850, not the "$0 to $5" the
Shopify model suggests. The consequences:

- Tier D runs only after an email is given. Anonymous scans get Tiers A and B.
- Tier D defaults to two providers and five prompts; the third provider and the long
  prompt set are a CLI flag for outreach pre-scans.
- A hard daily spend ceiling that degrades to Tiers A–B rather than erroring.
- 24-hour per-host cache, which also makes outreach pre-scanning free on repeat.
- Budget alerts on the Places and model API accounts.

## Abuse protection

As the tracking scanner: SSRF guard with re-check after redirects, global concurrency cap
via Cloud Run max instances, 3 anonymous scans per IP per day then email required, hard
cap of 20 per IP per day, per-host 24-hour cache, friendly failure inside 10 seconds for
dead domains and private IPs. Plus the daily API spend ceiling above.

## Testing plan

1. **Step 0 survey first.** Its output is the fixture corpus seed and the go/no-go.
2. **Fixture corpus.** Evidence bundles for 15 real local businesses spanning the failure
   modes: no matching listing, a true service-area business, flagged temporarily closed,
   Cloudflare edge-blocking AI UAs with a clean robots.txt, a robots.txt citation block,
   NAP only in JavaScript, two conflicting schema blocks, a phone mismatch, a Squarespace
   site, a Wix site, and several clean ones. Commit them. Detectors test offline.
3. **Ground truth by hand** for each fixture, written before the detector runs.
4. **Launch gate.** Reproduce every manual finding with zero false positives that would
   embarrass a cold email. Fix detectors, not thresholds. The three highest-risk false
   positives: matching the wrong listing, a false "no listing" on a service-area business,
   and an edge-block finding on a site that refused the controls too.
5. **Tier D variance check.** Same business, five runs across a week. If appearance moves
   run to run, the copy says so. Do this before writing the copy.
6. **Negative cases.** No website, a dead domain, each major builder, a Facebook-page-only
   business, a chain location, two businesses at one address, a private IP.
7. **Breadth check.** 20 more businesses from a real outreach list, every report read by
   hand.

## Effort estimate

- **[v2] Step 0 survey:** half a day. Decides whether the rest happens.
- Tier A detectors, evidence bundle, CLI, fixtures: 2 days. Useful alone after this.
- Tier B Places integration, SAB handling, match logic and disambiguation UI: 1.5 days.
- Tier D prompt sets, multi-provider calls, variance review: 1.5 days.
- Server, page, guards, permalinks, email gate, deploy: 1.5 days.

About a week and a half after Step 0, most of it in Tier D and the matching logic.

## Decisions still open (Andrew)

- **Run Step 0?** Half a day, no paid APIs, and it answers whether this is a business.
- **Channel to the buyer.** Cold email, phone, mail, or agencies. Changes the report.
- **Price of the paired fix**, knowing it cannot cite a dollar cost of the defect.
- **Which model APIs** for Tier D, given the per-scan cost.
- Apple Developer Program membership, if Apple Maps in v2 matters.
- GCP Places API enabled on the existing account, with a budget alert.

## Build order

Step 0 first. If it clears the threshold: Tier A detectors and CLI with fixtures, then
stop and read fifteen reports by hand. Tier A alone — "your host blocks the crawlers that
would cite you, and your phone number is invisible to machines" — is the cheapest test of
whether the opener lands, and it costs nothing in API spend.
