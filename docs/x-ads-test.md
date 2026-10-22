# X ads test: free scanner, pre-BFCM

Two weeks, $280, one question: does paid X traffic get Shopify owners to scan
their own store at a cost that beats the alternatives?

## Before launch

1. **Merge and deploy scanner PR #15** (RantumBits/ecomloop-scanner). Without it
   every X visit logs as a bare `https://t.co/...` referrer and the test cannot
   be read.
2. **Smoke test after deploy:** open the post-A link below, scan one store,
   then run `GOOGLE_CLOUD_PROJECT=<project> node script/campaign-report.mjs x`
   and check the row shows `content=two-ga4`. Delete that row or note its host.
3. **No X pixel.** At ~$280 X's conversion optimisation has nothing to learn
   from, so the campaign objective is Website traffic and the scan log is the
   source of truth. Add the pixel only if the test passes and scales.
4. **Shopifreaks exclusive runs to Oct 30.** Posts A and B quote the corpus
   study, so they cannot run before Oct 31. Post C has no study numbers and can
   run earlier if you want a head start.

## Dates and budget

- **Oct 31 to Nov 13**, $20/day, 14 days = **$280**.
- Stop by Nov 14 regardless: after that owners are in code freeze and Meta/X
  CPMs climb into BFCM.
- Objective: Website traffic (link clicks). Placement: home timeline and
  search. Exclude the audience network. Geo: US, UK, CA, AU. Language: English.
- One campaign, one ad group, three ads. X rotates them, and the tags below
  separate them in the scan log.

## Posts

Plain, first person, one finding each, link last. Each is under 280 characters.

**A: two GA4 properties** (`utm_content=two-ga4`)

> I scanned a random sample of 386 Shopify storefronts. 1 in 6 sends every sale
> to two different GA4 properties, so the revenue you see depends on which
> one you open.
>
> Free check for your store, about a minute:
> scan.ecomloop.com/?utm_source=x&utm_medium=paid&utm_campaign=bfcm-tracking&utm_content=two-ga4

**B: dead Universal Analytics** (`utm_content=dead-ua`)

> 6% of the Shopify stores I scanned still load Universal Analytics. Google
> stopped collecting UA data in 2023, so that tag slows the page and records
> nothing.
>
> Check yours before BFCM:
> scan.ecomloop.com/?utm_source=x&utm_medium=paid&utm_campaign=bfcm-tracking&utm_content=dead-ua

**C: double-firing purchase, no study numbers** (`utm_content=double-fire`)

> Before BFCM, check whether your purchase event fires twice. It usually
> happens when GA4 or the Meta pixel is installed in the theme and again
> through an app. Then your reports count some orders twice.
>
> Free scan:
> scan.ecomloop.com/?utm_source=x&utm_medium=paid&utm_campaign=bfcm-tracking&utm_content=double-fire

Numbers in A and B are from `docs/corpus-403-report.md`: 64 of 386 (16.6%) two+
GA4, 23 of 386 (6.0%) dead UA. Post A says "the revenue you see depends on
which one you open", not "never matches", because some second properties are
deliberate and the report says so. If X asks for the claim's source, the study page
goes public Nov 2.

## Targeting

**Follower look-alikes.** Type each name into X's follower targeting and keep
the ones X finds. I could not check the handles from here, so check that each
one is the right account and still active. Aim for 10 to 15 accounts.

Ecommerce and DTC operators and newsletters:
- Shopifreaks (the newsletter)
- 2PM / Web Smith
- DTC Newsletter (Pilothouse)
- Chase Dimond
- Nik Sharma
- Ezra Firestone
- Kurt Elster (Unofficial Shopify Podcast)
- Taylor Holiday (Common Thread Collective)
- Eli Weiss
- Triple Whale
- Northbeam
- Shopify

Leave out Shopify developer and agency accounts. Their followers are the people
who fix these problems, not the people paying for them.

**Keywords**, as a second targeting set in the same ad group: `shopify store`,
`shopify plus`, `bfcm`, `black friday sale`, `roas`, `ga4`, `meta ads`,
`triple whale`, `northbeam`, `ecommerce brand`.

## Success bar

What counts is **a completed scan of a distinct store from `utm_source=x`**.
Each one is a store that put its own tracking in front of us and usually has a
finding (75.9% in the corpus). The scan log keeps the host, so a store can get
a follow-up email even when the owner left no address. Clicks and CTR are
diagnostic only.

| Outcome at Nov 13 | Distinct stores scanned | Cost per store | Decision |
|---|---|---|---|
| Pass | 15 or more | $19 or less | Run Nov 14 to Dec 15 on the winning post; add the X pixel |
| Grey | 6 to 14 | $20 to $47 | Don't scale. Judge on whether any follow-up got a reply |
| Fail | 5 or fewer | over $47 | Stop. Paid X is not a channel for this |

**Why $19:** it is what the $250 newsletter sponsorship would cost if it brought
in 13 scans. 13 is a guess, not a measured number, but it puts paid X against
the paid option it competes with, not against cold email, which costs no money.

**Early stop at $100 spent (~Nov 4):** if CTR is under 0.5%, or there are
fewer than 2 scans, pause the weakest post and move its budget to the best one.
If all three are under that line, stop the test.

**Follow-up:** within two days of each scan, if its host has a tier-1 finding
(dead UA or two GA4s), send the usual short email about the store's own
findings. Log replies against `utm_content` so the test reads to "conversation",
not just "scan".

## Reading it

```bash
GOOGLE_CLOUD_PROJECT=<project> node script/campaign-report.mjs x 2026-10-31
```

Run from the scanner repo. It prints scans, distinct stores, stores with a
finding and emails per post, then one line per store for follow-up. Known gap:
if someone scans a store that is already cached, no row is written, so that
visit is not counted. Most stores arriving from an ad will not be cached, so
the undercount should be small.
