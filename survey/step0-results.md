# Step 0 results — 2026-10-01

Source: OpenStreetMap `website=*` tags, 24 categories × 16 US metros, single-metro hosts only (chain heuristic), ≤40 per category. Measured from a residential US IP, one pass, six UAs per site. Classification per `survey/analyze.mjs`; raw records in `survey/results.jsonl`.

## Population

| | |
|---|---|
| Sites surveyed | 826 |
| Reachable to a normal Chrome UA (denominator for HTML checks) | 646 (78.2%) |
| Both controls served (Chrome + Googlebot; denominator for edge checks) | 622 (75.3%) |
| Cloudflare-fronted (any `cf-ray` / `server: cloudflare`) | 283 (34.3%) |

Unreachable breakdown: error:ENOTFOUND: 49; challenge: 46; http 404: 17; error:UND_ERR_SOCKET: 15; error:UND_ERR_CONNECT_TIMEOUT: 15; http 403: 10; error:ERR_TLS_CERT_ALTNAME_INVALID: 9; error:ERR_SSL_SSL/TLS_ALERT_HANDSHAKE_FAILURE: 3; http 500: 3; error:UNABLE_TO_GET_ISSUER_CERT_LOCALLY: 2; error:CERT_HAS_EXPIRED: 2; error:ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR: 2; error:ECONNREFUSED: 2; error:ECONNRESET: 1; http 401: 1; error:DEPTH_ZERO_SELF_SIGNED_CERT: 1; error:TypeError: 1; http 521: 1.

## Kill-threshold composite

Share of reachable sites with **at least one** of {citation/user-fetch bot blocked (robots.txt certain, or edge two-control), phone absent from raw HTML (no digits match and no `tel:` link), conflicting LocalBusiness schema}:

| Definition | Share |
|---|---|
| **Strict composite (the spec's threshold)** | 128 (19.8%) |
| Wide composite (adds: phone not in visible text; no LocalBusiness schema at all) | 457 (70.7%) |

Thresholds written in the spec: <10% stop, ≥25% build, between: read fixtures and decide.

Components, each over the reachable set:

| Defect | Share | Examples |
|---|---|---|
| Citation/user-fetch bot blocked (robots or edge) | 32 (5.0%) | swkidsdentistry.com, appslive.com, mrmius.com, capitalandautobody.com, sagebrushcycles.net, riverboundvet.com |
| Phone absent from raw HTML | 74 (11.5%) | donnasitalian.com, makabeauty.com, farmer-boy.com, experiencemainemade.com, tastedcg.com, pastahouseva.com |
| Conflicting LocalBusiness schema | 32 (5.0%) | idahofitnessfactory.com, nonesuchriverbrewing.com, swkidsdentistry.com, bombayboise.com, myazlawyers.com, moderndent.com |

## A1 — AI agent access

### Edge, two-control method (denominator: both controls served, n=622)

| UA | Refused while both controls served | Of which Cloudflare-fronted |
|---|---|---|
| OAI-SearchBot (citation) | 10 (1.6%) | 1 |
| ChatGPT-User (user fetch) | 13 (2.1%) | 1 |
| PerplexityBot (citation) | 15 (2.4%) | 4 |
| GPTBot (training, reference) | 66 (10.6%) | 29 |
| **Any citation/user-fetch bot refused** | **22 (3.5%)** | 5 |
| Training-only block (GPTBot refused, citation bots served) | 44 (7.1%) | 24 |

Cloudflare-fronted sites with both controls served: 214. Of those, refusing any citation bot: 5 (2.3%). Non-Cloudflare sites refusing any citation bot: 17 (4.2%).

Examples, any citation bot refused at edge: swkidsdentistry.com, mrmius.com, capitalandautobody.com, riverboundvet.com, limenbasilca.com, jtechconst.com, cwccpas.com, medicaleyecenter.com, bevibrantmedspa.com, enterpriseinsagency.com, idahoveterinarysurgery.com, precisionheatingandcooling.com

### robots.txt (denominator: valid robots.txt served, n=641)

| | Share |
|---|---|
| robots.txt missing / unreachable | 131 (15.9%) |
| robots.txt returns HTML (soft 404) | 7 (0.8%) |
| `Disallow: /` under `*` | 19 (3.0%) |
| Citation bots blocked (any path, incl. inherited from `*`) | 20 (3.1%) |
| Citation bots blocked, token named explicitly | 1 (0.2%) |
| User-fetch bots blocked (any path) | 19 (3.0%) |
| User-fetch bots blocked, token named explicitly | 1 (0.2%) |
| Training bots blocked (any path) | 30 (4.7%) |
| Training bots blocked, token named explicitly | 14 (2.2%) |

Examples, citation token named and blocked in robots.txt: medicaleyecenter.com

## A2 — machine-readability of raw HTML (n=646)

| | Share |
|---|---|
| No phone number anywhere in HTML and no `tel:` link | 74 (11.5%) |
| No phone number in visible text | 149 (23.1%) |
| No `tel:` link | 246 (38.1%) |
| No street address or "ST 12345" in visible text | 190 (29.4%) |
| No day-name + time pattern in visible text (hours, heuristic) | 387 (59.9%) |
| noindex | 3 (0.5%) |
| Final URL not HTTPS | 35 (5.4%) |

## A3 — LocalBusiness structured data (n=646)

| | Share |
|---|---|
| ≥1 LocalBusiness(-subtype) entity | 254 (39.3%) |
| ≥2 LocalBusiness entities | 52 (8.0%) |
| ≥2 with conflicting phone or address | 32 (5.0%) |
| JSON-LD present but unparseable (≥1 block) | 12 (1.9%) |

Of sites with an entity (n=254): telephone 181 (71.3%); address as object 198 (78.0%); address as string 44 (17.3%); geo 125 (49.2%); hours 175 (68.9%); image 204 (80.3%); sameAs 119 (46.9%).

## By builder (reachable)

| Builder | n | Cloudflare | Citation block | Phone absent | Conflicting schema | No schema | Any strict defect |
|---|---|---|---|---|---|---|---|
| wordpress | 254 | 93 | 14 | 19 | 25 | 163 | 53 (20.9%) |
| other | 214 | 60 | 16 | 40 | 1 | 135 | 52 (24.3%) |
| squarespace | 62 | 2 | 1 | 1 | 1 | 17 | 3 (4.8%) |
| godaddy | 30 | 12 | 0 | 3 | 0 | 23 | 3 (10.0%) |
| wix | 29 | 17 | 0 | 0 | 3 | 11 | 3 (10.3%) |
| shopify | 19 | 19 | 0 | 6 | 1 | 16 | 7 (36.8%) |
| duda | 16 | 0 | 0 | 0 | 1 | 7 | 1 (6.3%) |
| weebly | 14 | 14 | 0 | 4 | 0 | 14 | 4 (28.6%) |
| hibu | 6 | 4 | 1 | 1 | 0 | 4 | 2 (33.3%) |
| webflow | 2 | 2 | 0 | 0 | 0 | 2 | 0 (0.0%) |

## By category (reachable)

| Category | n | Citation block | Phone absent | Conflicting schema | No schema | Any strict defect |
|---|---|---|---|---|---|---|
| veterinary | 36 | 4 | 0 | 1 | 21 | 5 (13.9%) |
| bicycle | 35 | 2 | 6 | 1 | 25 | 8 (22.9%) |
| insurance | 34 | 3 | 3 | 0 | 21 | 4 (11.8%) |
| fitness_centre | 32 | 0 | 6 | 1 | 20 | 7 (21.9%) |
| pet | 32 | 3 | 3 | 0 | 17 | 5 (15.6%) |
| car_repair | 32 | 1 | 3 | 1 | 18 | 4 (12.5%) |
| bakery | 32 | 0 | 5 | 0 | 16 | 5 (15.6%) |
| accountant | 31 | 7 | 4 | 2 | 21 | 12 (38.7%) |
| beauty | 31 | 1 | 5 | 1 | 20 | 6 (19.4%) |
| dentist | 31 | 3 | 1 | 8 | 14 | 11 (35.5%) |
| lawyer | 30 | 1 | 1 | 4 | 18 | 6 (20.0%) |
| doctors | 30 | 1 | 2 | 1 | 20 | 4 (13.3%) |
| florist | 30 | 1 | 6 | 0 | 18 | 7 (23.3%) |
| restaurant | 29 | 0 | 10 | 2 | 24 | 12 (41.4%) |
| hvac | 29 | 1 | 2 | 2 | 20 | 4 (13.8%) |
| cafe | 28 | 1 | 6 | 1 | 20 | 8 (28.6%) |
| hairdresser | 27 | 0 | 7 | 0 | 21 | 7 (25.9%) |
| optician | 25 | 1 | 0 | 0 | 12 | 1 (4.0%) |
| roofer | 23 | 2 | 1 | 3 | 9 | 5 (21.7%) |
| physiotherapist | 22 | 0 | 0 | 1 | 14 | 1 (4.5%) |
| electrician | 19 | 0 | 0 | 3 | 8 | 3 (15.8%) |
| plumber | 13 | 0 | 1 | 0 | 6 | 1 (7.7%) |
| painter | 8 | 0 | 0 | 0 | 3 | 0 (0.0%) |
| carpenter | 7 | 0 | 2 | 0 | 6 | 2 (28.6%) |

