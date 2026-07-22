# AstroTrip — offline astrology core (prototype)

A working vertical slice proving the offline-first thesis: **precise charts + basic
interpretation + a personalization loop that learns from lived experience — with no
network and no API at all.** Single `index.html`, no build step (same pattern as Hum).

Open `index.html` in a browser, or serve the folder statically. Nothing contacts the
network — verify in dev tools.

## What the slice already does

- **Real ephemeris, offline.** Compact analytic series (Schlyter) computes geocentric
  ecliptic longitudes for Sun–Pluto plus Ascendant/MC from sidereal time. Verified
  against real ephemeris for 1990-01-01 Moscow: Sun 10°41′ Cap, Saturn 15°38′ Cap,
  Uranus 5°46′ Cap, Neptune 12°02′ Cap, Pluto 17°05′ Sco — all correct to arc-minutes.
  This is the **seam** where Swiss Ephemeris (WASM) drops in for arc-second grade.
- **Chart wheel** (SVG) with sign sectors, whole-sign houses, ASC/MC axis, aspect lines
  (colour + dash by family), and **tap-to-isolate** (tap a planet → its aspects light up,
  detail sheet opens).
- **Offline interpretation** composed from a stub corpus (planet-in-sign, aspects).
- **Live transit engine** — today's transits vs the natal chart, ranked by personal weight.
- **On-device personalization loop** (the point below).

## The key idea: personalization WITHOUT any API

The differentiator — "adapt interpretations to how transits actually landed for *this*
user" — was assumed to need an LLM. It does **not**. An LLM was only ever doing prose
polish. The *learning* is a transparent on-device statistical model over structured
feedback plus variant selection. So the API can be dropped entirely and kept only as an
optional cosmetic bonus.

**How it works (all local, all in this prototype):**

1. **Structured feedback, not free text.** When a transit is active the user taps:
   resonance (☆☆☆ "did it land?"), valence (− · + "how did it feel?"), and an area chip
   (career / love / energy / mind / home). No NLP required — so no API required. (An
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
   future* Saturn transit — verified in the slice: rating Neptune□MC (weight 1.14→1.90)
   also lifted an unseen Neptune□Jupiter to 0.99. That is genuine generalization.

5. **Tone correction by variant selection, not generation.** The corpus ships 2–3
   pre-written phrasings per unit tagged by tone. Learned valence selects the phrasing
   that matches the user's lived experience (e.g. Saturn framed as "productive pressure"
   rather than "strain") — adapting the *text* with zero generation.

6. **Exact recall.** If this precise transit signature was rated before, the app surfaces
   it verbatim: "↺ Last time (date) you rated this 3/3 — '…'." Pure local memory, and one
   of the most powerful-feeling features. No model needed.

7. **Fully explainable.** The "What AstroTrip has learned about you" panel states the model
   in plain language ("Neptune transits land moderately for you, felt neutrally · 1.7/3").
   The user can read, trust, and correct it — impossible with an opaque LLM.

**Why this is better than an LLM here, not just cheaper:** transparent, deterministic,
private (the diary never leaves the device), works in airplane mode, and correctable.
The LLM's only remaining job is optional prose smoothing when online — and even that is
cached forever per (chart, day, corpus version), so a day is never regenerated.

## Roadmap (offline-first, API as bonus)

1. **Swap ephemeris → swisseph-WASM (Moshier mode)** — arc-second accuracy, all house
   systems, Chiron/nodes/asteroids, offline, no data files. (~0.35 MB wasm.)
2. **Real corpus** (~1,900 units, ~0.7 MB) — generated once with Claude to a strict schema
   (tone, theme vectors, variants), then human-edited. Shipped static; owned outright.
3. **Offline atlas** — GeoNames cities15000 packed (~1.6 MB) + tzdb history tables
   (~0.12 MB) + manual UTC-offset override for pre-1970 births.
4. **Rectification** — candidate-time scanner (±2 h @ 1-min, ~1.5–3 s on phone), scoring
   angles against dated life events. Only angles move across the window → cheap.
5. **Relocation + astrocartography** — planetary lines (~200 LOC) over a vector basemap
   (Natural Earth 50m, ~0.6 MB — not PMTiles); "best place" = grid scoring.
6. **Bonus online layer** — Claude polish (user key → tiny proxy), diary enrichment,
   HD map tiles. Every feature degrades to a full offline equivalent; nothing hard-fails.

Total offline core budget: **~3.9 MB** — fits one service-worker precache.

## Known prototype shortcuts

- Positions are arc-minute grade (analytic series), not arc-second (production: swisseph).
- Houses are whole-sign only (production: Placidus/Koch/etc. from swisseph).
- Zodiac glyphs in the SVG wheel render as OS colour emoji on some platforms; production
  uses the monochrome **Astronomicon** glyph font for the papery aesthetic.
- Corpus is a stub; the composition engine (scoring, dedup, tension-framing) is designed
  but only partially wired here.

---

© 2026 Daniel Fainberg (dafaspace). All rights reserved.
Published for transparency, not licensed for reuse or redistribution.
