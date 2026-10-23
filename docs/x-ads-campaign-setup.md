# X ads: campaign setup

The setup notes written before launch. For what actually launched (dates,
budget, the added `chat-ga4-video` ad, the AI disclosure lines, checkpoints),
see "As launched" in `docs/x-ads-test.md`; where the two differ, that section
wins.

How to set up the test in `docs/x-ads-test.md` in X Ads Manager. Two changes
from that plan: **four ads, not three** (A and B only; C sits this round out), and a
second question alongside it: **does an AI version of you hold attention
better than an AI-generated presenter?**

## Videos

In `x-ads-footage/final/` (kept out of git). All are 15.0s, 1080x1920, H.264
and AAC at about -16 LUFS, with captions burned in and an "AI-generated
presenter" label under the presenter for the whole video.

| Ad | `andrew` group | `becca` group |
|---|---|---|
| A: two GA4 properties | `a-two-ga4-polo.mp4` | `a-two-ga4-becca.mp4` |
| B: dead Universal Analytics | `b-dead-ua-polo.mp4` | `b-dead-ua-becca.mp4` |

- **Andrew:** HeyGen photo avatar "Andrew in his office" (navy polo, office
  with a window), your cloned voice.
- **Becca:** HeyGen photo avatar "Becca in the office", stock voice "Noelle".

End cards: A asks "Is your store counting the same sale twice?"; B asks "Is
your store still loading Universal Analytics?". B's silent cut was rebuilt for
that on Oct 22; the earlier version is kept as
`x-ads-footage/15s/b-dead-ua-15s-silent-v1.mp4`.

Also in `final/`, not used this round: C for both presenters, and A, B and C
with the video-trained twin (`*-twin.mp4`).

## Structure

- **Campaign:** `bfcm-tracking`. Objective **Website traffic**. Launched for
  Oct 23 to Nov 13, with $190 caps per group (originally planned for Oct 31).
  The campaign doesn't optimise on the X pixel.
- **Two ad groups, $10/day each**, identical targeting:
  - `andrew`: `a-two-ga4-polo.mp4`, `b-dead-ua-polo.mp4`
  - `becca`: `a-two-ga4-becca.mp4`, `b-dead-ua-becca.mp4`

  The presenter split is by ad group, so each presenter gets the same spend.
  Within a group X rotates A and B toward whichever does better.
- **Targeting, both groups:** US, UK, CA, AU. English. Home timeline and
  search; exclude the audience network. Follower look-alikes and keywords from
  `docs/x-ads-test.md`. Check the handles there in X's follower search before
  saving.
- **Ad format:** Video Website Card. The link goes in the card, not the post,
  so the whole video is the click target.
  - Headline: `Free tracking scan for your Shopify store`
  - Destination: the URL for that ad, below.

## Links

One `utm_content` per ad, so the scan log separates finding and presenter.
`script/campaign-report.mjs x` groups by `utm_content`, so it shows four rows.

```
https://scan.ecomloop.com/?utm_source=x&utm_medium=paid&utm_campaign=bfcm-tracking&utm_content=two-ga4-andrew
https://scan.ecomloop.com/?utm_source=x&utm_medium=paid&utm_campaign=bfcm-tracking&utm_content=dead-ua-andrew
https://scan.ecomloop.com/?utm_source=x&utm_medium=paid&utm_campaign=bfcm-tracking&utm_content=two-ga4-becca
https://scan.ecomloop.com/?utm_source=x&utm_medium=paid&utm_campaign=bfcm-tracking&utm_content=dead-ua-becca
```

The smoke test in `docs/x-ads-test.md` checks for `content=two-ga4`; with these
links, look for `two-ga4-andrew` instead.

## Post text

The card carries the link, so the posts drop it. The last line is the AI
disclosure: "AI version of me" in the `andrew` group, "AI presenter" in the
`becca` group. All are under 280 characters.

**A** (239 / 235 characters)

> I scanned a random sample of 386 Shopify storefronts. 1 in 6 sends every sale
> to two different GA4 properties, so the revenue you see depends on which one
> you open.
>
> Free check for your store, takes a few minutes.
>
> Video: AI version of me. / Video: AI presenter.

**B** (209 / 205)

> 6% of the Shopify stores I scanned still load Universal Analytics. Google
> stopped collecting UA data in 2023, so that tag slows the page and records
> nothing.
>
> Check yours before BFCM.
>
> Video: AI version of me. / Video: AI presenter.

## Reading the presenter test

Compare the presenters around **Nov 1** (about $180 spent), ad by ad (the
chat ad shares the `andrew` budget), on X's video
metrics, not scans. Scans are too few to split two ways.

- **3s/100% view rate:** 3-second fully in-view views divided by impressions.
  This is where a presenter shows up first.
- **Completion rate:** 100% playback divided by video starts.

If one group is at least 20% better on 3s view rate with comparable
impressions, move its $10/day to the other group for the last week. If they're
within 20% of each other, call it a tie and leave both running; the success
bar for the whole test is still distinct stores scanned (`docs/x-ads-test.md`).

The early stop at $100 still applies, per ad rather than per post.
