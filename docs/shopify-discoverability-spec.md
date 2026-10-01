# Shopify Discoverability Profile — Spec v2

Revision after a critic pass on v1. Changes marked **[v2]**: the mechanism by which reviews
reach each surface was wrong and is rewritten; corpus counts corrected to the 8 product
pages actually tested; the review-app detector was found broken and its claim removed; F1
demoted from headline to candidate headline until it has run.

A second section for the EcomLoop Tracking Scanner (`docs/tracking-scanner-spec.md`, branch
`claude/shopify-tracking-scanner-spec-10c07b`). Same input, same browser session, same
report, same CTA. The tracking half says *you are measuring wrong*; this half says *when a
shopper asks, you are not being found, or not being chosen*. Together they are meant to be the two
halves of "convert more searchers to customers" for a buyer who already pays for the
first. **[v2]** Whether the second half moves that buyer is untested; see F1 and Testing.

## Where this came from

It started as a separate tool for local businesses (`docs/local-discovery-scanner-spec.md`,
now parked). A prevalence survey of 826 local sites (`docs/step0-results.md`) found the
AI-crawler-blocking finding fires on about 4% of sites and the audience is low-ticket and
over-solicited. Two things carried over: the **searcher-journey framing** — found, chosen,
reached — which makes every report non-empty where a defect list was empty 82–85% of the
time (Step 0: strict composite 15.5–18.4%), and the **email-gate-as-exchange** design, where the address buys the most vivid
section rather than merely lifting a rate limit. Pointed at Shopify brands, the module
needs no new buyer, brand or price.

## The journey, for a DTC shopper

| Step | The shopper's question | What we can measure from outside |
|---|---|---|
| **Found** | "Best [product type] for [use]?" asked of ChatGPT, Perplexity, Claude; a Google Shopping search | Whether the brand is named or cited; who is named instead; whether the crawlers that feed those answers can read the store; whether the catalogue is machine-readable |
| **Chosen** | Next to the others named, does this one look like the pick? | Reviews and rating *as machines see them* (structured data), price and availability consistency, what the assistants say about the brand verbatim |
| **Reached** | Can the shopper get to a product page and buy? | Product pages render server-side, canonical, not challenged for non-browser clients, `/products.json` open |

Checkout and conversion stay out of scope, as in the tracking spec. Say so in the report.

## Checks

The capture layer already renders the homepage and one product page in Playwright for the
tracking scan. Everything below except Tier D reads from that same session plus three
plain fetches (`/robots.txt`, `/products.json`, one Chrome-vs-bot-UA pair). No new
browser work.

### Found

**F1. What the assistants say (Tier D, the candidate headline — [v2] unrun; promoted only if the 10-store pass earns it).** Build five to seven prompts from
the store itself: `product_type` and `tags` from `/products.json`, the brand name, the
meta description. Templates:

- "What's the best [product type] for [common use]?"
- "Where should I buy [product type] online?"
- "Is [brand] worth it?" / "[brand] reviews"
- "[brand] vs [competitor named by an earlier prompt]"
- "Best [product type] under $[median price from products.json]"

Run across two or three model APIs with web search enabled. Record verbatim: brand named
or not; cited with a link to the store's own domain or not; which brands and *retailers*
appear instead; anything stated about the brand that is wrong (price, "discontinued",
shipping, ingredients). **[v2]** Hypothesis to test on the 10 stores, not a pattern to
expect: that assistants send the shopper to Amazon for the category. If it holds, the
report states it as a fact about the category and does not claim the audit changes it.

Raw, never scored. Appearance tally, exact prompts, date, verbatim excerpts, and the note
that answers vary between runs. These are search-grounded APIs, not the consumer apps; say
which.

**F2. Can the citation crawlers read the store?** `robots.txt` for the three token classes
(training / citation / user-fetch), and the two-control edge test (Chrome, Googlebot, then
`OAI-SearchBot` and `PerplexityBot`). Confidence graded as in the local spec.

*Corpus result (10 fixture brands, `survey/shopify-check.json`):* Shopify's default
`robots.txt` names no AI bot and Shopify's edge served every AI UA on all 9 testable
stores. One store customised `robots.txt` to **allow** `OAI-SearchBot` explicitly. One
store (Fair Harbor) runs a Cloudflare challenge on all non-browser clients — inconclusive,
and the report must say "we could not test this as a crawler would see it" rather than
infer a block. Expect F2 to be a one-line confirmation on most stores and a finding on few.

**F3. Is the catalogue machine-readable? [v2 rewritten]** `/products.json` open and
returning the catalogue (9 of 10; Chamberlain Coffee redirects it to the homepage).
`Product` or `ProductGroup` JSON-LD on the product page with `offers`, `price`,
`priceCurrency`, `availability`, `brand`, `image`, and an identifier (`gtin`/`mpn`/`sku`).

Who reads what — v1 collapsed these into one "organic pathway" and was wrong:

| Surface | What it reads | Source |
|---|---|---|
| Google Merchant Center automated feed | On-page Product schema: title, price, availability, image required | [Google: add products automatically from your online store](https://support.google.com/merchants/answer/12158480) |
| Google organic result review stars | On-page `aggregateRating` in Product schema | Google rich-result requirements |
| Google Shopping product ratings | A **separate ratings feed from an eligible aggregator** (Okendo, Yotpo, Judge.me, Loox); typically 50+ reviews and a GTIN or MPN on the product | [Google: submit product reviews data](https://support.google.com/merchants/answer/14620160) |
| ChatGPT shopping | **A merchant product feed**, not a crawl. Nine required fields; `star_rating` and `review_count` optional. Shopify wires the catalogue for merchants who enable it in admin | [OpenAI product feed spec](https://developers.openai.com/commerce/specs/feed) |
| Search-grounded assistant answers (F1) | Page text, as any reader would | — |

Consequences for the audit: on-page schema is the lever for Google's two surfaces and for
F1; the identifier (`gtin`/`mpn`) is a precondition for the ratings programs; whether a
merchant has enabled ChatGPT Shopping, or whether their feed carries `star_rating`, is not
detectable from outside and goes on the fix list, not in the findings.

*Corpus result (8 product pages tested; Chamberlain had no product to test, Fair Harbor
was challenged):* 8 of 8 emit Product schema (Sunski as `ProductGroup`); availability in
schema matched `/products.json` on 8 of 8; **an identifier (gtin/mpn/sku) was present on
6 of 8** — the two without it cannot enter the Google ratings program as-is.

### Chosen

**C1. Reviews as machines see them. [v2 rewritten]** Three checks, reported separately
because three different machines read three different things:

- *On-page:* a review widget renders a count and rating in the HTML, and `aggregateRating`
  with a matching `reviewCount` is in the Product schema. The gap between the two is the
  finding, and it affects Google's organic review stars for that page. A text-reading
  assistant sees the widget text regardless.
- *Identifier:* `gtin` or `mpn` present, because the Google Shopping ratings programs
  require it.
- *Feed:* not observable. "Confirm your ChatGPT Shopping feed populates `star_rating` and
  `review_count`, and that your review app's Google ratings feed is connected" is a
  fix-list line, stated as such.

*Corpus result:* **one confirmed gap in 8.** Brightland's product page shows "Rated 4.9 out
of 5 stars, based on 531 reviews" in server-rendered text and emits no `aggregateRating`.
Four stores emit `aggregateRating` matching the visible count product-for-product. Three
others emit none but also show no review count on the product tested, so no gap is
demonstrated there. v1 said "4–5 of 9" and named Sunski; that was wrong. v1 also claimed
"Yotpo on 9 of 9" from a detector that matched app names in a shared script on every store;
app identity is unverified and the detector must read the widget container, not a
substring, before the report names an app.

**C2. Price and availability consistency.** Schema vs `/products.json` vs what the
assistants quoted. A wrong price in an AI answer traces to one of the two sources.

**C3. The verbatim.** What the assistants said about the brand, quoted.

### Reached

**R1.** Product page served to a non-browser client without challenge (the Fair Harbor
case), canonical set, HTTPS, `noindex` absent. Mostly a confirmation on Shopify.

## Report

A second section under the tracking findings, same voice. Lead with the assistant
answers, then the review-markup gap, then the rest.

> We asked three assistants for the best [product type]. None named you; two sent the
> shopper to [retailer], one to [competitor]. Your [product] page shows 531 reviews to a
> visitor, but the page's structured data carries no rating, so Google shows no stars for
> it in search results.

**[v2]** Placeholders, as in the tracking spec. v1 put a made-up assistant answer naming a
real competitor in this slot while demanding verbatim quotes everywhere else.

Not:

> AI Visibility Score: 23/100.

Under it, the collapsed "what we saw": every prompt and response, the markup extracted,
the three-UA responses, the date.

## Gate: the exchange

**[v2] Reconcile with the tracking spec**, which gates differently: 3 anonymous scans per
IP per day, then an email for any scan, hard cap 20. One tool needs one rule. Proposed:
the tracking spec's IP limits stay as abuse control; the email additionally unlocks F1/C3
from the first scan. Update the tracking spec when the branches merge.

- **Anonymous run:** tracking findings, F2, F3, C1, C2, R1. Everything that costs
  nothing. Ends with: "We also asked ChatGPT, Perplexity and Claude about you. Enter an
  email to see what they said."
- **Email:** unlocks F1 and C3, the permalink, and three scans a day.
- **CLI (sales tool):** everything, no gate, run on outreach targets. Same as the tracking
  spec's internal use.

No accounts. Magic-link sign-in only if people come back to re-run, which is a monitoring
product and a separate decision.

## Cost

Tracking scan: ~$0.003. This profile adds **$0.25–0.75 per scan for F1**
([Anthropic $10/1k searches](https://www.anthropic.com/news/web-search-api);
[OpenAI $10–25/1k calls](https://www.modelcostwatch.com/openai/tool-costs/web-search);
[Perplexity Sonar $5–12/1k requests](https://www.cloudzero.com/blog/perplexity-api-pricing/),
plus tokens) and nothing else. F1 runs only after the email, so the anonymous tier stays
at tracking-scan cost. 24-hour cache per store; daily spend ceiling that degrades to the
anonymous report rather than erroring.

## Non-goals

- Google Shopping rank or Amazon listing audit. Both need SERP scraping or paid APIs.
- Validating a merchant feed inside Merchant Center or the Shopify admin.
- Scoring. Anything called a "visibility score."
- Checkout, as before.

## Testing

1. The 10 fixture brands have F2, F3, C2 and the on-page half of C1 in
   `survey/shopify-check.json` (8 product pages). Re-record them as evidence bundles when the
   capture layer exists, with a review-widget detector that reads container classes.
2. F1 has not been run; it needs API keys. Run it on the same 10 first, five times across a
   week, and read how much the answers move before writing the report copy.
3. Launch gate, as in the tracking spec: no claim in a report that would embarrass a cold
   email. Specific risks here: inferring a block from a Cloudflare challenge; calling
   per-product review counts a bug when they are correct for that product; stating a
   price the assistant quoted as if the store quoted it.
4. Breadth: 20 stores from the outreach list, every report read by hand.

## Open decisions (Andrew)

- **[v2]** Is the discoverability half worth building at all before F1 has run on 10
  stores? The corpus so far supports one confirmed review-markup gap, two missing
  identifiers, one closed `/products.json`, and no crawler findings. That is a paragraph in
  the tracking report, not a second half, unless F1 adds the sentence.

- API keys for F1 (Anthropic, OpenAI, optionally Perplexity).
- Does the audit price change now that it has two halves, or is discoverability the
  reason the $1,750 is easier to say yes to? Decide before the offer page copy changes.
- Whether to run the 20-store F1 pass before or after the tracking CLI checkpoint. Before
  is ~$25 and answers whether this section adds a sentence to the cold email.

## Build order and effort

Slot in after the tracking spec's first checkpoint (CLI reports for the 10 stores exist).
F2, F3, C1, C2, R1 reuse the existing capture: 1 day including fixtures. F1 prompt
templates, provider calls, variance review: 1.5 days. Report section: half a day. Call it
three days on top of the tracking build.
