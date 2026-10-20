# Two samples, one answer: how often Shopify tracking is broken

I sell tracking audits to Shopify stores, and I run a free scanner that finds the problems. This month I ran it on two groups of storefronts that were put together in completely different ways. On the two clearest defects, the results came out within 0.6 points of each other.

| Finding | 192 brands I picked (Oct 5) | 386 random storefronts (Oct 13-14) |
|---|---|---|
| Two or more GA4 properties | 17.2% | 16.6% (64 of 386) |
| Universal Analytics still loading | 6.3% | 6.0% (23 of 386) |

The first group was a hand-picked list of well-known DTC brands. The obvious objection to it is that I chose them. So the second group was drawn at random: a random sample of Shopify storefronts in the Majestic Million, a public list of the top million websites ranked by how many other networks link to them. Nobody chose those stores, and they produced nearly the same numbers.

## What the random sample showed

386 storefronts, scanned October 13 and 14, 2026:

- **16.6% (64)** load two or more GA4 properties that belong to the store. Shared app IDs and placeholder IDs are not counted. Every visit and sale is sent to each property, so the numbers you see depend on which one you open. Sometimes the second property is deliberate, and a scan can't tell which.
- **6.0% (23)** still load Universal Analytics. Google stopped processing standard UA data in July 2023. The script still downloads on every page view and records nothing anyone can use.
- **27.2% (105)** fire the same tag twice on one page. That can count page views or events twice. One way it happens is a tag installed both through an app and by hand. GA4 was the most common (73 stores), then the Meta pixel (31) and Bing (22).
- **26.5% (82 of 310)** have a tag on the storefront that does not appear at checkout. The base here is the 310 stores whose checkout page loaded for the scanner. Some stores send purchases server-side instead, which a scan from outside can't see, so treat this one as something to check rather than a verdict.

**146 of the 386 stores (38%)** had at least one of the first three. Counting checkout-blind as well, 181 (47%).

The other two findings agree more loosely. In the hand-picked group, duplicate firing was 32.8% and checkout-blind was 31.6%, about five points higher than the random sample. My guess is that well-known brands run more tags and more apps, so they have more chances to double up. I haven't tested that.

## Why nobody goes looking

More than a third of a random sample has at least one of the first three problems. Yet in Google's Keyword Planner (checked October 13, 2026), all the US searches for tracking audits and analytics consultants together come to about 600 to 700 a month. Searches that describe the symptom, like "ga4 not matching shopify" or "duplicate purchase event ga4", are each under 10 a month.

My read: fewer people hiring consultants, or asking a chatbot instead, explains some of the low search volume. It doesn't explain why the symptom searches are close to zero. A store with two GA4 properties or a doubled tag gets no error. The dashboard loads, the charts move, and the numbers look reasonable. They are just wrong, and nothing prompts anyone to check. People search for problems they can see.

So if you run a store, don't wait for the dashboard to show it. Look at what the site actually loads. Open a product page in Google Tag Assistant and count the GA4 IDs (they start with G-) against your own, look for any UA- ID, and check that one page load sends one page_view. The full step-by-step check is on the published page.

## Method notes

- **2026-10-05.** Hand-picked panel: 193 well-known DTC brands, 192 scanned successfully. The panel figures above are after detector fixes made on 2026-10-06, re-checked offline from the stored scan evidence. The scan-day output overcounted two-GA4 stores (45 on the day, 33 after the fixes), which is why the second sample got the offline re-check described below.
- **2026-10-13.** Downloaded the Majestic Million. Shuffled it with a fixed random seed (20261013) and checked domains in that order with a fixed four-signal Shopify test until 403 Shopify storefronts were found. That took 18,900 domains; 2.13% were Shopify.
- **2026-10-13 to 14.** Scanned all 403. 386 completed; 17 failed (14 timeouts, 2 unreachable, 1 other). The scanner independently confirmed Shopify on all 386. Each scan loads up to four pages in a real browser (home, a product page, cart, checkout) and records which tags load and which requests fire. 283 of the 386 reached all four; 39 reached only the home page. For those stores the rates above are floors.
- **2026-10-14.** Re-ran the detector offline on all 386 stored evidence bundles. No store's result changed.
- **Excluded.** The scanner runs 20 other checks that are not reported here. Two of them (conversion misfire and tracking cost) were considered and dropped because they raise too many false alarms to publish as defects.
- **Limits.** Because the Majestic Million ranks by links, this sample leans toward larger, established stores. It is a random sample of Shopify storefronts in the Majestic Million, not of all Shopify stores. Headless Shopify sites don't pass the selection test, so they aren't in it. A scan sees only what loads in a visitor's browser. It can't see server-side tracking or GA4 admin settings.
- **Aggregate only.** No store is named here.

Contains data from the Majestic Million (https://majestic.com), licensed under CC BY 3.0.

Andrew, ecomloop. The scanner used for this study is free at scan.ecomloop.com.
