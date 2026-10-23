# X ads test: free scanner, pre-BFCM

About 19 days, $380, one question: does paid X traffic get Shopify owners to
scan their own store at a cost that beats the alternatives?

## As launched

Published Oct 22 and approved that night (status "Scheduled"). Campaign
`bfcm-tracking` (ID 42833443) in the EcomLoop ad account, posting as @ecomloop.

- **Fri Oct 23, 06:00 PT, scheduled to end Fri Nov 13, 23:59 PT.** $20/day
  across two ad groups, **$380** at most. The start moved up from Oct 26 on
  Oct 22; the caps stayed at $190 per group, so each group stops when it hits
  its cap, around **Nov 10** (day 19), before the scheduled end.
- Objective: Website traffic (link clicks), auto bid. Placement: home timeline
  and search results. Geo: US, UK, CA, AU. Language: English. X's "Optimize
  targeting" is off. Targeting is the same in both groups (see Targeting below).
- **Two ad groups, $10/day each with a $190 total cap.** They split by
  presenter, so each presenter gets the same spend:

| Ad group | Ad (`utm_content`) | Creative |
|---|---|---|
| `andrew` | `two-ga4-andrew` | Post A, HeyGen avatar of Andrew (office, polo), his cloned voice |
| `andrew` | `dead-ua-andrew` | Post B, same avatar |
| `andrew` | `chat-ga4-video` | Mock chat plus real report, marked "Illustration"; not AI |
| `becca` | `two-ga4-becca` | Post A, AI-generated presenter "Becca" |
| `becca` | `dead-ua-becca` | Post B, same presenter |

- Every link is `scan.ecomloop.com/?utm_source=x&utm_medium=paid&utm_campaign=bfcm-tracking&utm_content=<tag>`.
  X keeps the parameters in its "URL tracking" field, not the website URL.
- The AI ads end their post text with "Video: AI version of me (Andrew)." or
  "Video: AI presenter.", and carry X's "Made with AI" label. The chat ad has
  neither.
- Post C (double firing) isn't running this round. A `chat-ga4-image` ad was
  built but X dropped it from the draft on save, so it didn't launch.
- Setup notes and the post text as entered are in `docs/x-ads-campaign-setup.md`.

**The presenter comparison is ad by ad, not group by group.** The chat ad shares
the `andrew` group's $10/day, so compare `two-ga4-andrew` and `dead-ua-andrew`
against the two `-becca` ads on 3-second view rate and completion rate.

**Test rows to leave out:** dgk.com (`two-ga4`, Oct 22) and juniperridge.com
(`two-ga4-andrew`, Oct 23) were tracking checks, not ad traffic.

## Before launch (done)

1. **Scanner PR #15** (RantumBits/ecomloop-scanner) is deployed, so X visits
   log their campaign tags, not a bare `https://t.co/...` referrer.
2. **Smoke tests passed:** the scan log showed `content=two-ga4` on Oct 22 and
   `content=two-ga4-andrew` on Oct 23.
3. **The X pixel is installed** on the scanner, but the campaign doesn't
   optimise on it. At this budget X's conversion optimisation has nothing to
   learn from, so the objective is Website traffic and the scan log is the
   source of truth.
4. **The study is public** at https://ecomloop.com/shopify-tracking-study.html
   since Oct 22, so the Shopifreaks exclusive no longer limits the start date.

## Dates and budget

- **Oct 23 to about Nov 10**, $20/day, 19 days = **$380**, when the $190
  caps run out (the scheduled end is Nov 13).
- Stop by Nov 14 regardless: after that owners are in code freeze and Meta/X
  CPMs climb into BFCM.

## Posts

The original drafts. A and B ran with these words, minus the link (the
website card carries it) and plus the AI disclosure line. C didn't run.

Plain, first person, one finding each, link last. Each is under 280 characters.

**A: two GA4 properties** (`utm_content=two-ga4`)

> I scanned a random sample of 386 Shopify storefronts. 1 in 6 sends every sale
> to two different GA4 properties, so the revenue you see depends on which
> one you open.
>
> Free check for your store, takes a few minutes:
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
is public at https://ecomloop.com/shopify-tracking-study.html.

## Video ads

Each post above runs as a video ad, with the post text as its copy. Same three
`utm_content` tags, so the scan log still tells them apart.

**Rules for all three**

- **The AI presenter is a narrator, never a customer.** It states what the
  study found and shows the scanner. No first-person "I ran this on my store"
  lines, no reactions, no names. A made-up user is a fake testimonial under the
  FTC's 2024 rule, whatever tool made it.
- **Label it.** A small on-screen "AI-generated presenter" for the whole video,
  and add `Video: AI presenter.` as the last line of the post text.
- **The proof is the screen recording.** The presenter frames the problem; a
  real scan running is what makes the claim believable. Never mock up a result.
- **20 to 30 seconds, 9:16 or 1:1, captions burned in.** Most X video plays
  muted, so the captions carry the message on their own.
- **Numbers say "a random sample of Shopify storefronts"**, never "of Shopify
  stores". That phrasing is required by the study's method note.

### A: two GA4 properties (`two-ga4`)

| Time | Picture | Voiceover | On-screen text |
|---|---|---|---|
| 0–3s | Presenter, tight framing | "Your GA4 revenue could be counted twice, and your dashboard wouldn't tell you." | **Counted twice?** |
| 3–11s | Animation: one sale splits into two GA4 dashboards showing different totals | "We scanned a random sample of 386 Shopify storefronts. One in six sends every sale to two different GA4 properties." | **1 in 6** send sales to two GA4 properties |
| 11–15s | Presenter | "So the revenue you see depends on which one you open." | **Which number is real?** |
| 15–25s | Screen recording, shot list below | "Check yours. Paste your store's address, and a few minutes later you'll see every GA4 ID it loads." | **Free scan · a few minutes** |
| 25–28s | End card | — | **scan.ecomloop.com** |

### B: dead Universal Analytics (`dead-ua`)

| Time | Picture | Voiceover | On-screen text |
|---|---|---|---|
| 0–3s | Presenter | "Google switched off Universal Analytics in 2023. Is your store still loading it?" | **Still loading UA?** |
| 3–11s | Animation: a UA tag loading on every page, its data going nowhere | "In a random sample of 386 Shopify storefronts, 6% still do. The script downloads on every page view and records nothing." | **6% still load it** |
| 11–15s | Presenter | "Nothing on your dashboard will tell you it's there." | **Dead code, every page view** |
| 15–25s | Screen recording, shot list below | "Paste your store's address. The scan lists every tag your site loads, including the dead ones." | **Free scan · a few minutes** |
| 25–28s | End card | — | **scan.ecomloop.com** |

### C: duplicate firing (`double-fire`)

| Time | Picture | Voiceover | On-screen text |
|---|---|---|---|
| 0–3s | Presenter | "Before Black Friday, check whether your tracking fires twice." | **Firing twice?** |
| 3–12s | Animation: the same tag reaching the page twice, once through an app and once added by hand | "In a random sample of 386 Shopify storefronts, more than a quarter fired the same tag twice on one page. One way it happens: the tag is installed through an app and again by hand." | **27% fire a tag twice** |
| 12–15s | Presenter | "Then your reports count some events twice." | **Same event, counted twice** |
| 15–25s | Screen recording, shot list below | "Paste your store's address. The scan shows which tags fire more than once." | **Free scan · a few minutes** |
| 25–28s | End card | — | **scan.ecomloop.com** |

C now quotes the study (105 of 386, 27.2%). It says "some events", not
"orders": the study counted any tag firing twice on a page, not purchases
specifically.

### Screen recording (shared by all three)

One recording, about 40 seconds raw, cut to 10 seconds in each video.

1. Browser at scan.ecomloop.com, clean window, no bookmarks bar or other tabs.
2. Paste a store address and press **Scan my site**.
3. Let the progress run; it will be sped up in the edit.
4. The report loads. Scroll slowly past the summary to the finding that matches
   the video: two GA4 properties for A, Universal Analytics for B, duplicate
   firing for C. If one store doesn't show all three, record more than one.
5. Hold on each finding for 2 seconds so the caption can be read.
6. **Crop or blur the "N of M stores we have scanned had this" line** under each
   finding. It is the scanner's running count across everyone who has used it,
   a self-selected group, so it won't match the study. On Oct 22 the two-GA4
   finding read "37 of the 72 stores". Next to a voiceover saying "one in six",
   that looks like the ad contradicting itself.

**Which store.** Showing a real brand's defects in an ad is a risk of its own, so either:

- **Blur a real store.** Scan a store from the corpus that has the finding you
  need. In the edit, blur the domain in the address bar, the report title, any
  brand names and the tag IDs. Public lookup tools can tie a GA4 or Meta ID
  back to the site that uses it.
  **Recorded Oct 22** (files in `x-ads-footage/`, kept out of git, with
  `timestamps.txt` marking where to blur):
  - **ayoubs.ca** is the one to use. Its live report shows all three:
    two GA4 properties, Universal Analytics (finding 10 of 11), and GA4, Meta
    and Bing each firing twice. It was emailed in the outreach batch, so blur
    thoroughly.
  - **deerruntreadmill.com** is a backup for A and C only. Its live scan
    couldn't add a product to the cart and didn't report Universal
    Analytics, although a local scan did.
  - Not wusthof.com: a brand people would recognise even blurred.

  **Scans take 2 to 3 minutes, not one.** Both recordings took about 2.5
  minutes from Scan to report, so speed the progress up in the edit and keep
  the captions at "a few minutes". The scan page itself still says "Takes
  about a minute"; that should change with the wait-time work.

  The live scanner caches each result for 24 hours, so a fresh take of the
  scan itself is one per store per day. The report scroll-through can be
  re-recorded any time from its `/r/` link.

- **Use your own demo store.** A Shopify store you control, with GA4 installed
  twice and a UA tag left in. The results are real, and nothing needs blurring.
  Check first that the scanner can reach it: a development store behind a
  storefront password probably won't scan.

### Making them

- **Presenter:** an AI avatar tool such as HeyGen or Synthesia, with a stock
  avatar in a plain setting. Avoid tools built around fake "customer" UGC.
- **Animations and edit:** any editor with simple motion graphics. The three
  animations are basic: one sale splitting into two, a tag loading with nothing
  coming out, one tag arriving twice.
- **Before launch,** check each video for: the "AI-generated presenter" label
  on screen, numbers matching the study, no real brand visible, and captions
  readable with sound off.

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

**Early check at $100 spent (around Oct 27, day 5 of 19):** any ad with CTR
under 0.5%, or fewer than 2 scans, gets paused, and X moves its group's budget
to the other ads in that group. If every ad is under that line, stop the test.
Don't pause a whole group on this check; that ends the presenter comparison
early.

**Presenter read around Nov 1:** compare the two `-andrew` ads with the two
`-becca` ads on 3-second view rate. If one presenter is at least 20% ahead with
comparable impressions, move the other group's $10/day to it for the rest of
the test.

**Follow-up:** within two days of each scan, if its host has a tier-1 finding
(dead UA or two GA4s), send the usual short email about the store's own
findings. Log replies against `utm_content` so the test reads to "conversation",
not just "scan".

## Reading it

```bash
GOOGLE_CLOUD_PROJECT=ecomloop-scanner node script/campaign-report.mjs x 2026-10-23
```

Run from the scanner repo. It prints scans, distinct stores, stores with a
finding and emails per `utm_content`, then one line per store for follow-up.
Starting at Oct 23 leaves out the dgk.com test row, but **not**
juniperridge.com (`two-ga4-andrew`, logged Oct 23 UTC): drop that row by hand.
Add each finding's `-andrew` and `-becca` rows
together to read A against B. Known gap:
if someone scans a store that is already cached, no row is written, so that
visit is not counted. Most stores arriving from an ad will not be cached, so
the undercount should be small.
