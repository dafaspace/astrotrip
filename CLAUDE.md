# AstroTrip - project notes for every session

Project specifics that win over the portfolio rules in `My Apps/CLAUDE.md`. The code and its
reasons are in `README.md`; the market is in `MARKET.md`.

## Money

_Written 13 Oct 2026 by the AstroTrip session at Dafa's request, from MARKET.md (25 Sep), the
_HQ audit (13 Oct) and the decisions of 11 Oct. Each claim is marked: **[fact]** checked, with
where; **[decided]** Dafa's word; **[proposal]** waiting for Dafa; **[unknown]** not checked.
Not yet confirmed by Dafa as a whole. Points 2 and 3 revised the same day after his word on the
trial and on where the line runs._

**1. Who pays, for what, how much, how often.**
A practising astrologer or an astrology student outside Russia pays once, about $9.99, for a
professional chart and forecasting tool on the phone that works offline, keeps clients' charts
on the device, and whose positions are checked against JPL Horizons. **[decided 11 Oct:** one-time,
about $10, no subscription**]** Nothing recurs that would justify a subscription - no server, no
new data, no AI (main instruction, section 5) - and Astro Gold's move from $49.99 once to a
subscription in Dec 2025 left it at 3.67 stars, the lowest in its field **[fact, MARKET.md]**.

**2. The fastest route to the first paying stranger.**
The App Store: a free download, seven days of everything, then a one-time unlock. **[decided
13 Oct]** A professional pays after trying the tool on real clients, so the upfront sale
proposed earlier the same day is dropped; Astro Gold, by the makers of Solar Fire, runs exactly
this - a 7-day trial of everything, then a free tier that stays usable, and the rest as a
lifetime purchase **[fact, its App Store listing, 13 Oct]**. Apple allows a trial without a
subscription in one way (guideline 3.1.1): a $0 non-consumable item named "7-day Trial", with the
length, what stops working and the price stated before the trial starts. The work: StoreKit
through a purchase plugin, the unlock, a restore button and that screen - about 2-3 days, not
started.

What blocks it, in order:
- **App Store Connect record and the TestFlight upload.** Dafa's step, possible by 20 Oct 2026.
  The signed 3.17.0 IPA with its privacy manifest is built and checked.
- **The trial and the unlock** (above), after Dafa's word to start them.
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
The rule a buyer can say back in one line: **one chart is free; a chart set against time or
against another person is paid.** **[decided 13 Oct]**
- **Free forever, on the web and in the app:** a natal chart and everything about it -
  positions, aspects, dignities, dispositor chains, receptions, configurations, the aspect grid,
  balance, relocation, the text block, printing - plus the library of 1019 charts, saving, and
  CSV export and import. Data is never behind the price (main instruction, section 3).
- **Paid once, after the 7-day trial:** every chart with a second or third ring - transits,
  progressions, directions, solar and lunar returns, synastry, the tri-wheels - and the
  composite, which is made of two charts. These are the tools of working with a client over
  time, the same line Astro Gold and TimePassages draw **[fact, their App Store listings]**.
- **The free tool that search finds:** the natal chart calculator, and ephemeris pages for 2026
  and 2027 - "ephemeris 2026" is Google's first suggestion for "ephemeris" **[fact, 13 Oct]**;
  the pages are not built (404).
- **The weak spot, said out loud:** with transits paid, "транзиты онлайн" and "transit chart
  calculator" - both real search suggestions **[fact, 13 Oct]** - leave the free tool, and so
  does the daily habit of checking today's sky. The ephemeris pages answer part of that need for
  free. The people lost are mostly amateurs, who are not the paying audience.
- **The web is the free tier, with a week's key.** **[decided 13 Oct]** The website shows the free
  tier only. Everything opens for a week with a code - in practice a link - that Dafa hands to a
  tester or to a professional who asks. **[built 14 Oct, v3.18.0]** The link carries its end date and
  a signature made with a private key that never leaves Dafa's machine
  (`node tools-access-key.mjs issue [days] [name]`); the app holds only the public key, so a
  code cannot be made up, and no server or account is needed. The store build is full until its
  purchase lands; when it gates too, the same code will open the sideloaded APK, which cannot
  buy through Google Play. Two limits, said plainly: a
  code can be forwarded during its week, and anyone who edits the page in developer tools can
  open the paid part, because a website without a server can only keep honest people honest.
  How Dafa hands a key out, and what to do if the private key is lost: `ACCESS-KEYS.md`.
  The web cannot take payment (no provider for a seller in Georgia is confirmed, and Paddle bans
  horoscopes outright); the dafaspace.com card that promises forecasting on the web changes
  with this.
- **Price, open:** $9.99 proposed; Astro Gold Essentials is $24.99 **[fact, MARKET.md]**.
  Experiment: after the first 20 sales or on 31 Jan 2027, whichever comes first, move the price
  and write down sales per week before and after.

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
How many of the 10-20 invited astrologers answer yes to "after a week with everything, would you
pay $9.99 once for transits, progressions, returns and synastry", checked on 15 Nov 2026. **[proposal]** Three or more: the paid version is built. Fewer: money is
not reachable; AstroTrip goes to the store free, keeps the feedback and the engine, and gets no
new features.
