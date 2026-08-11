# AstroTrip - offline astrology core (prototype)

A working vertical slice proving the offline-first thesis: **precise charts + basic
interpretation + a personalization loop that learns from lived experience - with no
network and no API at all.** No build step: the app is `index.html` plus a handful
of static files it loads (three subset web fonts, `manifest.json`, `sw.js`, icons).

**Serve the folder, do not open the file directly.** `python3 -m http.server` in this
directory is enough. Over `file://` a service worker cannot register at all, so there
is no offline shell and no install; Chrome and Safari additionally refuse the
self-hosted fonts, since a file origin is opaque, and the type falls back to a system
face. Served, it installs to the home screen and runs with the network off. Nothing
contacts the network - verify in dev tools.

## Tests

Open `test.html` through the same local server. It loads the real `index.html`
in an iframe and calls its functions in that context: nothing is mocked, and a
stale build cannot pass, because the harness clears the service worker and its
caches first. That mattered: before it did, a deliberately broken app passed
every check.

48 checks in seven groups. Ephemeris (one position set verified against an
external reference, two regression anchors), robustness (1850-2200, polar
latitudes, southern hemisphere), house systems (angles land on the cusps, cusps run
round the circle without crossing, the quadrant systems coincide at the equator), the
chart library (every composer casts, every house system works on every one of them,
and the writing rules hold across all twelve rather than on the one chart development
used), the reading (no
repeated sentences, no leftover periphrasis, no invented deadlines, full
pair coverage), contrast (every text pair against WCAG AA, chart lines and
sector glyphs, in both themes), and interface wiring (the theme switch must
not corrupt the language, which it once did).

The suite is falsified, not just green: reintroducing the sector alpha and
collapsing the MC colour into the aspect colour both make it fail by name.

## What the slice already does

- **Real ephemeris, offline.** Compact analytic series (Schlyter) computes geocentric
  ecliptic longitudes for Sun–Pluto plus Ascendant/MC from sidereal time. Verified
  against real ephemeris for 1990-01-01 Moscow: Sun 10°41′ Cap, Saturn 15°38′ Cap,
  Uranus 5°46′ Cap, Neptune 12°02′ Cap, Pluto 17°05′ Sco - all correct to arc-minutes.
  This is the **seam** where Swiss Ephemeris (WASM) drops in for arc-second grade.
- **Six house systems**: Placidus, Regiomontanus, Campanus, Porphyry, equal and whole
  sign, chosen in the form and remembered. Beyond the polar circle Placidus is
  undefined and the calculation falls back to equal houses, so the chart title names
  the system actually used rather than the one asked for. Koch is deliberately absent:
  its pole definition did not come out of the sources unambiguously, and an unverified
  house system is worse than none.
- **Chart wheel** (SVG) with sign sectors, ASC/MC axis, aspect lines coloured and
  dashed by family, and tap-to-isolate: tapping a planet lights up its aspects and
  opens a detail sheet.
- **Offline interpretation**: 212 readings written for specific planet pairs, one per
  aspect type, plus per-sign and per-house phrasing. No astrological jargon in the
  prose; the terms appear only in card titles.
- **Live transit engine** - today's transits vs the natal chart, ranked by personal weight.
- **On-device personalization loop** (the point below).
- **Chart library**: twelve composers, classical and film, plus your own charts saved
  to this device. Each entry carries a Rodden rating. Only Mozart's time is documented
  (from the baptismal record); for the rest the time is unknown, so the chart is cast
  for noon and labelled as such, since the Ascendant, the houses and the Moon's degree
  mean nothing without it. Historical entries use local mean time rather than a zone
  offset, and pre-1918 Russian and pre-1700 German dates are stored in the Gregorian
  calendar with the Julian original noted.
- **Installs and runs offline.** Manifest, icons and a service worker that precaches the
  shell. Verified by stopping the server and reloading.
- **Two themes** with a switch in the header, following the system until it is touched.
  Every text pair clears WCAG AA in both; the numbers are in the test suite.
- **Self-hosted type** (Inter and Literata, subset to 101 KB) so the same text renders
  the same way on every device.

## The key idea: personalization WITHOUT any API

The differentiator - "adapt interpretations to how transits actually landed for *this*
user" - was assumed to need an LLM. It does **not**. An LLM was only ever doing prose
polish. The *learning* is a transparent on-device statistical model over structured
feedback plus variant selection. So the API can be dropped entirely and kept only as an
optional cosmetic bonus.

**How it works (all local, all in this prototype):**

1. **Structured feedback, not free text.** When a transit is active the user taps:
   resonance (☆☆☆ "did it land?"), valence (− · + "how did it feel?"), and an area chip
   (career / love / energy / mind / home). No NLP required - so no API required. (An
   optional offline sentiment/keyword lexicon can enrich free-text diary notes later, but
   it is never on the critical path.)

2. **Feature decomposition.** Each transit hit is decomposed into generalizable features:
   transiting planet, aspect type, natal receiver, and area. An observation updates
   running stats for *each* feature, not just the exact signature.

3. **Bayesian shrinkage.** Each feature keeps `resonance` (0–3) and `valence` (−2…+2) as
   an incremental mean shrunk toward a prior (`(prior·k + Σobs)/(k + n)`), so one rating
   nudges, many ratings commit. Cold start behaves sensibly; confidence grows with data.

4. **Ranking correction.** A new transit's `personalWeight = structuralRank × exactnessBell
   × learnedResonance`. Rating one Saturn transit as "strong" raises the rank of *every
   future* Saturn transit - verified in the slice: rating Neptune□MC (weight 1.14→1.90)
   also lifted an unseen Neptune□Jupiter to 0.99. That is genuine generalization.

5. **Tone correction by variant selection, not generation.** The corpus ships 2–3
   pre-written phrasings per unit tagged by tone. Learned valence selects the phrasing
   that matches the user's lived experience (e.g. Saturn framed as "productive pressure"
   rather than "strain") - adapting the *text* with zero generation.

6. **Exact recall.** If this precise transit signature was rated before, the app surfaces
   it verbatim: "↺ Last time (date) you rated this 3/3 - '…'." Pure local memory, and one
   of the most powerful-feeling features. No model needed.

7. **Fully explainable.** The "What AstroTrip has learned about you" panel states the model
   in plain language ("Neptune transits land moderately for you, felt neutrally · 1.7/3").
   The user can read, trust, and correct it - impossible with an opaque LLM.

**Why this is better than an LLM here, not just cheaper:** transparent, deterministic,
private (the diary never leaves the device), works in airplane mode, and correctable.
The LLM's only remaining job is optional prose smoothing when online - and even that is
cached forever per (chart, day, corpus version), so a day is never regenerated.

## Roadmap (offline-first, API as bonus)

1. **Swap ephemeris → swisseph-WASM (Moshier mode)** - arc-second accuracy, all house
   systems, Chiron/nodes/asteroids, offline, no data files. (~0.35 MB wasm.)
2. **Decide the corpus question.** The hand-written tables are now the real corpus. Either
   widen them (house-in-sign, dignities beyond four buckets) or reconnect the Podvodny
   material that currently only supplies tags.
3. **Offline atlas** - GeoNames cities15000 packed (~1.6 MB) + tzdb history tables
   (~0.12 MB) + manual UTC-offset override for pre-1970 births.
4. **Rectification** - candidate-time scanner (±2 h @ 1-min, ~1.5–3 s on phone), scoring
   angles against dated life events. Only angles move across the window → cheap.
5. **Relocation + astrocartography** - planetary lines (~200 LOC) over a vector basemap
   (Natural Earth 50m, ~0.6 MB - not PMTiles); "best place" = grid scoring.
6. **Bonus online layer** - Claude polish (user key → tiny proxy), diary enrichment,
   HD map tiles. Every feature degrades to a full offline equivalent; nothing hard-fails.

Total offline core budget: **~3.9 MB** - fits one service-worker precache.

## Known limitations

- Positions are arc-minute grade. The analytic series was checked against an external
  ephemeris for 1990-01-01 Moscow and matched to within one arc-minute, but Swiss
  Ephemeris is the standard and this is not it. Item 1 of the roadmap.
- The keyword tags under each card heading come from a small weighted dictionary
  (`TAG_TOKENS`, 5.5 KB). It began as prose distilled from Podvodny, but the readings
  are written by hand now and only the weights were ever read, so the unused 32 KB was
  removed rather than left to look like a source of truth.
- The twelve library charts now exercise the code across three centuries and both
  hemispheres, but eleven of them have no known birth time. They test that the code
  holds up; they cannot test that a reading is *right* about anyone.
- No synastry, progressions, solar returns or composites. Kerykeion and similar engines
  have them.
- Everything lives in one 283 KB file. That has kept the project free of a build step,
  and it will eventually stop being an advantage.

---

© 2026 Daniel Fainberg (dafaspace). All rights reserved.
Published for transparency, not licensed for reuse or redistribution.

Exception: the three bundled web fonts (`inter-400.woff2`, `inter-500.woff2`,
`literata-500.woff2`) are subsets of Inter and Literata, both under the SIL Open
Font License 1.1. See [OFL.txt](OFL.txt).
