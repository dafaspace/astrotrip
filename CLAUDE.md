# AstroTrip - project notes for every session

Project specifics that win over the portfolio rules in `My Apps/CLAUDE.md`. The code and its
reasons are in `README.md`; the market is in `MARKET.md`.

## Money

_Written 13 Oct 2026 by the AstroTrip session at Dafa's request, from MARKET.md (25 Sep), the
_HQ audit (13 Oct) and the decisions of 11 Oct. Each claim is marked: **[fact]** checked, with
where; **[decided]** Dafa's word; **[proposal]** waiting for Dafa; **[unknown]** not checked.
Not yet confirmed by Dafa as a whole._

**1. Who pays, for what, how much, how often.**
A practising astrologer or an astrology student outside Russia pays once, about $9.99, for a
professional chart and forecasting tool on the phone that works offline, keeps clients' charts
on the device, and whose positions are checked against JPL Horizons. **[decided 11 Oct:** one-time,
about $10, no subscription**]** Nothing recurs that would justify a subscription - no server, no
new data, no AI (main instruction, section 5) - and Astro Gold's move from $49.99 once to a
subscription in Dec 2025 left it at 3.67 stars, the lowest in its field **[fact, MARKET.md]**.

**2. The fastest route to the first paying stranger.**
The App Store, the app sold at $9.99 upfront. **[proposal]** Upfront rather than free plus an
in-app unlock (the plan of 11 Oct): no StoreKit code, no purchase plugin, no restore flow, and
the precedent sells - Time Nomad at $8.99 and iPhemeris at $29.99 are sold upfront and hold
4.66-4.77 **[fact, MARKET.md]**. The free trial is the website.

What blocks it, in order:
- **App Store Connect record and the TestFlight upload.** Dafa's step, possible by 20 Oct 2026.
  The signed 3.17.0 IPA with its privacy manifest is built and checked.
- **Paid Applications Agreement, with tax and a bank.** **[unknown]** whether Apple pays into a
  Georgian bank. App Store Connect's own rule: a bank it cannot find is a bank it cannot pay.
  Check in App Store Connect > Business > Agreements, Tax and Banking by adding the bank. Dafa,
  ten minutes, by 20 Oct.
- **The private test before the price:** 10-20 astrologers, one instruction - find a wrong fact -
  and one question about paying (point 6). 20 Oct to 10 Nov.
- **Russia is out.** Apple stopped all payments there on 1 Apr 2026 and Google Play blocks paid
  apps **[fact, MARKET.md, with sources]**. Russian-speaking testers in Russia bring feedback, not
  money; the paying strangers are outside Russia.
- **Google Play** after iOS. A new personal account needs a closed test of 12 testers for 14 days
  before production; whether the Play account exists and is paid is **[unknown]**.

Target: the first paying stranger by 30 Nov 2026.

**3. Free and paid.**
- **The free tool that search finds: the website.** A natal chart calculator with today's
  transits, the library of 1019 charts, and ephemeris pages for 2026 and 2027 - "ephemeris
  2026" is Google's first suggestion for "ephemeris" **[fact, 13 Oct]**. The ephemeris pages are
  not built (404).
- **The product it leads to:** the iOS app, then Android - the whole tool.
- **The paid part:** the app, $9.99 once. **[proposal]** On the web, the forecasting modes -
  progressions, directions, solar and lunar returns, synastry, composite, the tri-wheel - become
  "in the app". That is the line between reading a chart and working with a client over time: a
  difference of value, not a quota. Data stays free everywhere: saving, CSV export and import are
  never behind the price (section 3, control over data). If this is taken, the dafaspace.com card
  that promises forecasting on the web changes with it.
- **Price experiment:** start at $9.99; after the first 20 sales or on 31 Jan 2027, whichever
  comes first, move to $14.99 and write down sales per week before and after.

**4. If money is not reachable.**
It is not proven: nobody has said they would pay **[fact]**; free calculators (astro.com,
astro-seek, ZET Lite, Jagannatha Hora) cover most of what we compute; and the professional
segment is small - NCGR about 2500 members, the flagship mobile app 230 ratings **[fact,
MARKET.md]**. MARKET.md's own conclusion is that the professional market is a credential, not a
business. If the number in point 6 fails, AstroTrip earns instead:
- **live feedback** from real professionals on a correctness tool;
- **an engine:** the only calculation layer in the portfolio checked against an outside
  reference, the one AstroChat would import;
- **reputation** as a developer of tools that are exactly right. Weak for his paid work as a
  composer, sound designer and editor, because astrologers are not his clients - said plainly.

Hours saved on his own work: none.

**5. Where the gain is kept.**
- **Feedback - does not exist.** No contact inside the app, no mailbox named for replies. Needed
  before the private test: a "Write to the developer" line under Sources and accuracy, and
  TestFlight's built-in feedback. Which address collects the replies is Dafa's call.
- **Engine - does not exist.** `astro-core.js`, extracted from `index.html` with `parity.txt` as
  the contract (253 lines, held byte for byte on web, iOS and Android). Extract when AstroChat
  starts, or earlier if the ephemeris pages need the engine outside the browser.
- **Reputation - partly.** AstroTrip is on dafaspace.com as "Beta" with a link to the web app. A
  case with the JPL check and the store link comes after the listing.

**6. The number and the date.**
How many of the 10-20 invited astrologers answer yes to "would you pay $9.99 once for this",
checked on 15 Nov 2026. **[proposal]** Three or more: the paid version is built. Fewer: money is
not reachable; AstroTrip goes to the store free, keeps the feedback and the engine, and gets no
new features.
