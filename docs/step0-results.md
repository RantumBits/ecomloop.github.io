# Step 0 — prevalence survey results (2026-10-01)

The spec (`docs/local-discovery-scanner-spec.md`) said: before building, measure how often
the defects the tool would report actually occur on local business websites, and write the
kill threshold down first. Threshold: **under 10% stop; 25% or more build; between, read
the fixtures and decide.** This is the measurement.

Scripts and raw data are in `survey/`: `collect-sites.mjs` (sample), `survey.mjs`
(measurement), `analyze.mjs` (classification), `results.jsonl` (826 raw records, one per
site), `step0-results.md` (auto-generated tables, uncorrected). Everything below is
reproducible from those files.

## Verdict

**Outcome (same day):** local scanner parked; the discoverability module was redirected at
Shopify brands as a profile of the tracking scanner — `docs/shopify-discoverability-spec.md`.
A pre-check of the same measurements on the 10 fixture Shopify brands is in
`survey/shopify-check.json`.

**Strict composite: 15.5–18.4% of reachable sites, depending on definition.** Under the
spec's literal definition — edge-refused citation bot, phone absent from raw HTML,
conflicting schema as first detected — it is 18.4%. With the schema conflicts corrected to
the 12 verified by hand it is 15.5%. Adding robots.txt citation blocks, which the spec
calls the certain case, gives 16.9%. All three are inside the gray zone. The component the
spec was built around is near zero.

| Component | v1 estimate in spec | Measured | After hand-checking |
|---|---|---|---|
| Citation/user-fetch bot blocked (robots.txt or edge) | "the headline check" | 5.0% | **3.9%**, dominated by two hosting vendors' WAFs and one pasted block-list |
| Phone absent from raw HTML | "a large share" | 11.5% | 11.5%, of which **5.1% are pages empty without JavaScript** |
| Conflicting LocalBusiness schema | — | 5.0% | **1.9%** (26 of the 32 were legitimate multi-location businesses) |

The spec's own rule says: do not build the AI-discovery scanner as specified. The
"your site tells AI assistants not to read it" finding fires on roughly one site in
twenty-five, and the version of it the spec called common — Cloudflare's default-on rule
blocking citation bots — was not observed: of 214 Cloudflare-fronted sites with both
controls served, **5 refused a citation bot; 24 refused only GPTBot**, which is the
toggle working as designed. One limit on that: the default applies to zones created after
July 2025, and this sample is local sites of unknown zone age, so it shows the behaviour
is uncommon among local sites rather than testing the new-zone default directly.

What the data does show is a different product, discussed at the end.

## Sample

826 unique hosts from OpenStreetMap `website=*` tags: 24 categories × 16 US metros
(Boise, Asheville, Tucson, Grand Rapids, Chattanooga, Spokane, Richmond, Omaha, Fresno,
Albany, Portland ME, Bend, Medford, Columbus, Raleigh, Sacramento), capped at 40 per
category, any host appearing in more than one metro dropped as a chain. Social, aggregator
and booking-platform URLs excluded.

**Known bias:** OSM tags skew toward businesses someone bothered to map, and toward older
listings. The dead-site rate below is inflated by businesses that have closed. Trades
categories came out thin (plumber 13, carpenter 7, painter 8); food, beauty and retail
are well represented. It is a sample of local businesses with websites, not of
outreach targets.

## Population

| | n | share |
|---|---|---|
| Surveyed | 826 | |
| Reachable to a normal Chrome UA (denominator for HTML checks) | 646 | 78.2% |
| Both controls served, Chrome and Googlebot (denominator for edge checks) | 622 | 75.3% |
| Cloudflare-fronted | 283 | 34.3% |
| Domain does not resolve (ENOTFOUND) | 49 | 5.9% |
| TLS / certificate failure | 19 | 2.3% |
| Connection timeout, reset or refused (may be transient) | 33 | 4.0% |
| HTTP 404, 410, 500 or 521 | 21 | 2.5% |
| Challenged or 403'd *as Chrome* (inconclusive, mostly Cloudflare bot-fight) | 56 | 6.8% |

The 60 Cloudflare-fronted sites that challenged or refused the Chrome control are a
measurement limit: Node's TLS fingerprint is not a
browser's, so some Cloudflare configurations refuse the control. They are excluded from
edge figures, not counted as blocks. Re-running those 60 with a real browser as the
control would settle them; the upper bound if every one of them blocked citation bots is
still under 12%.

## A1 — AI agent access

### Edge, two-control method (n = 622)

| UA refused while Chrome and Googlebot were both served | n | share | Cloudflare |
|---|---|---|---|
| OAI-SearchBot | 10 | 1.6% | 1 |
| ChatGPT-User | 13 | 2.1% | 1 |
| PerplexityBot | 15 | 2.4% | 4 |
| GPTBot (training; reference) | 66 | 10.6% | 29 |
| Any of the three citation / user-fetch bots | 22 | 3.5% | 5 |
| GPTBot only, citation bots served | 44 | 7.1% | 24 |

Hand-checking the 22: seven refused only ChatGPT-User and served both search bots; three
had a 114-byte JavaScript-redirect stub as the "served" control (Akamai-fronted, same
hosting vendor); one is an expired domain now parked on a marketplace page. The remainder
split between an origin-level bot list (`mrmius.com`, 403 to every bot UA, no CDN) and
hosts that refuse all non-browser agents.

### robots.txt (n = 641 valid files)

| | n | share |
|---|---|---|
| robots.txt missing or unreachable | 131 | 15.9% of 826 |
| `Disallow: /` under `User-agent: *` (blocks Google too) | 19 | 3.0% |
| Citation bots blocked, any path including inherited from `*` | 20 | 3.1% |
| Citation bots blocked, **token named explicitly** | 1 | 0.2% |
| Training bots blocked, token named explicitly | 14 | 2.2% |

One site in 641 named a citation bot in robots.txt (`medicaleyecenter.com`, a pasted
block-everything-AI list). The other 19 "blocks" are `Disallow: /` for all agents, which
is a different and worse defect: they are telling Google to leave.

**What this means for the spec.** The story "the owner toggled 'block AI' and unknowingly
blocked the bots that cite them" is not what happens. Squarespace's toggle (off by
default) and Cloudflare's default rule both block training bots and serve citation bots,
and the 7.1% training-only figure is that behaviour showing up. The spec's A1 is a
legitimate check with a correct fix; it is a ~4% finding and cannot lead a tool.

## A2 — machine-readability of raw HTML (n = 646)

| | n | share |
|---|---|---|
| Fewer than 300 characters of visible text to a non-JS fetch | 50 | 7.7% |
| of which: single-page-app shell (`id="root"` etc.) | 21 | 3.3% |
| of which: JavaScript-redirect stub | 9 | 1.4% |
| of which: parked / expired / suspended | 2 | 0.3% |
| of which: other — mixed; some served a full page on re-fetch, some are small non-SPA pages | 18 | 2.8% |
| No phone digits anywhere in HTML and no `tel:` link | 74 | 11.5% |
| No phone number in visible text (all 149 re-fetched and re-checked with a looser pattern: 0 false negatives; 48 are empty shells) | 149 | 23.1% |
| No `tel:` link | 246 | 38.1% |
| No street address or "ST 12345" in visible text | 190 | 29.4% |
| No day-name + time pattern in visible text (hours; weak heuristic, over-counts) | 387 | 59.9% |
| Final URL not HTTPS | 35 | 5.4% |
| `noindex` | 3 | 0.5% |

The shells are concentrated in cafes, bakeries, restaurants and salons, and several are
Acuity, SimplePOS or similar booking pages used as the business's only website
(`peachnails7308.simplepos.us`, `manicaveappointments.as.me`). A crawler that does not
run JavaScript — which, as far as the vendors document, includes the AI retrieval
crawlers — gets an empty page from these.

## A3 — LocalBusiness structured data (n = 646)

| | n | share |
|---|---|---|
| At least one LocalBusiness(-subtype) entity | 254 | 39.3% |
| Two or more entities | 52 | 8.0% |
| Two or more entities, **same location, conflicting phone or address** | 12 | 1.9% |
| Two or more entities, distinct locations (legitimate) | 26 | 4.0% |

Of the 254 with an entity: telephone 71%, address as a structured object 78%, geo 49%,
hours 69%.

The 12 true conflicts are the most specific finding in the survey. Five are dental
practices and two are accounting firms. The pattern is two marketing plugins each
emitting the practice, with inconsistent formatting, a city typo ("Tuscon"), and in
`moderndent.com` **two different phone numbers for the same office** — a call-tracking
number has leaked into the schema. That is a NAP defect caused by an agency, invisible to
the owner, and fixable once. It is 1.9% overall (95% CI 1–3%) and 5 of the 31 dentists sampled — 16%, but with five
cases the interval is 7–33%, so treat it as a lead to check on a dental-only sample, not
a rate.

## By builder (reachable)

| Builder | n | Cloudflare | Shell or stub | Phone absent | True conflict |
|---|---|---|---|---|---|
| WordPress | 254 | 93 | — | 19 | 7 |
| Unidentified / custom | 214 | 60 | most shells | 40 | 1 |
| Squarespace | 62 | 2 | 0 | 1 | 1 |
| GoDaddy | 30 | 12 | — | 3 | 0 |
| Wix | 29 | 17 | 0 | 0 | 2 |
| Shopify (retail) | 19 | 19 | 0 | 6 | 1 |

Squarespace sites had little wrong on any measure: one conflict, one phone-absent, one
citation block in 62. Seven of the twelve schema conflicts are on WordPress; the other
five are spread across Wix, Shopify, Squarespace and an unidentified builder.

## By category, corrected composite

Composite here = citation-specific block, or empty shell, or phone not in visible text,
or true schema conflict.

| Category | n | Shell | Phone not visible | True conflict | Composite |
|---|---|---|---|---|---|
| cafe | 28 | 5 | 15 | 0 | 57% |
| beauty | 31 | 4 | 14 | 0 | 48% |
| accountant | 31 | 2 | 6 | 2 | 45% |
| fitness_centre | 32 | 4 | 14 | 0 | 44% |
| bakery | 32 | 9 | 13 | 0 | 44% |
| restaurant | 29 | 7 | 11 | 1 | 41% |
| bicycle | 35 | 1 | 13 | 0 | 37% |
| hairdresser | 27 | 4 | 10 | 0 | 37% |
| florist | 30 | 5 | 8 | 0 | 33% |
| dentist | 31 | 0 | 2 | 5 | 29% |
| insurance | 34 | 1 | 6 | 0 | 21% |
| car_repair | 32 | 1 | 5 | 0 | 16% |
| hvac | 29 | 1 | 3 | 1 | 14% |
| lawyer | 30 | 0 | 3 | 0 | 13% |
| veterinary | 36 | 0 | 0 | 0 | 11% |
| plumber | 13 | 1 | 1 | 0 | 8% |

The defects cluster in low-ticket food, beauty and fitness — the audience least able to
pay for a fix — and are rare in the trades the spec used as its examples. Dentists and
accountants are the exception: fewer defects, but the ones they have are agency-caused
schema conflicts, and they can pay.

## What the data supports instead

Two directions, neither of which is the spec as written. Both are Andrew's call.

**1. A "can a machine read your website" check, not an AI-discovery check.** Domain does
not resolve (5.9% of listings), broken HTTPS (2.3%), HTTP error (2.5%) — all inflated by
stale listings, with a further 4.0% of timeouts that may be transient — parked or expired, empty without JavaScript (3–5%), phone
or address not in the page text (23–29%), broken HTTPS (~2%). These are real, cheap to
detect, and not what any AI-visibility vendor sells — but they are what every free
website grader has sold for fifteen years, and the owners most affected run cafes and
nail salons. Composite 28.5%, above the build threshold, for a product the spec said not
to build.

**2. A vertical tool for dental and accounting practices.** The schema-conflict finding
is agency-caused, owner-invisible, carries a concrete wrong-phone-number story, and sits
in a vertical that spends on marketing and pays for fixes. It is 5 of 31 inside that vertical — a
lead, not a rate — with the full A2/A3/Places check set behind it. Smaller market, sharper
pitch, closer to the Shopify model (find the cruft a previous vendor left). Would need
its own prevalence pass on a dental-only sample before committing.

Not supported by this survey: an AI *access* headline. The citation-block finding is real
and the fix is real; it belongs in the report body, not in the headline. Whether
assistants state wrong hours or phone numbers for a business (Tier D) was not tested
here and could still carry a headline; see below.

## What Step 0 did not measure

Tier B (Google listing missing, closed status, NAP mismatch, missing hours) needs a Places
API key and spend. Tier D (what assistants actually say about a business, and whether it
is wrong) needs model API spend, roughly $0.25–0.75 per site. Step 0 measured crawler
access, not assistant accuracy. Tier B may carry higher prevalence than anything here;
Tier D is the one untested finding that could still justify an AI headline, and a 30-site
pass at under $25 would settle it.

## Fixture seed

For whichever direction proceeds, the corpus the spec asked for is now identifiable from
`survey/results.jsonl`:

- Empty shells: `tastedcg.com`, `pastahouseva.com`, `lamplightercoffee.com`, `johnspizza.com`
- JS-redirect stubs: `donnasitalian.com`, `cwccpas.com`, `precisionheatingandcooling.com`
- Parked / expired: `capitalandautobody.com`, `tomwhitecarpentry.com`
- True schema conflicts: `swkidsdentistry.com`, `moderndent.com`, `bombayboise.com`, `vfdentist.com`, `primedentalaz.com`, `rileywiglecpas.com`
- Legitimate multi-location (must *not* flag): `idahofitnessfactory.com`, `myazlawyers.com`, `nonesuchriverbrewing.com`
- Explicit robots.txt AI block-list: `medicaleyecenter.com`
- Origin-level bot block, no CDN: `mrmius.com`
- GPTBot-only block, correct behaviour (must *not* flag): `riverboundvet.com`, `swkidsdentistry.com`
- `Disallow: /` for everyone: 19 hosts, see `robots.starDisallowAll` in results
