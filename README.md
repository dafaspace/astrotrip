# AstroTrip

**Precise charts offline, and time you can move.** No build step, no server, no API:
the app is `index.html` plus the static files it loads (`ephemeris.js`, `cities.txt`,
three subset web fonts, `manifest.json`, `sw.js`, icons).

**Serve the folder, do not open the file directly.** `python3 -m http.server` in this
directory is enough. Over `file://` a service worker cannot register at all, so there
is no offline shell and no install; Chrome and Safari additionally refuse the
self-hosted fonts, since a file origin is opaque, and the type falls back to a system
face. Served, it installs to the home screen and runs with the network off.

## What it does

### The ephemeris

VSOP87D for the planets, ELP82B truncated to 607 terms for the Moon, and a piecewise
Chebyshev fit to JPL DE441 for Pluto, because no compact analytic theory for Pluto
holds outside 1885-2099. Apparent geocentric positions: light-time, annual aberration,
IAU2000B nutation, IAU 2006 mean obliquity, and Greenwich apparent sidereal time from
the Earth Rotation Angle.

Checked against JPL Horizons on **every chart in the library**: worst disagreement
3.9″ over 1685-1984, under 0.5″ in the twentieth century. Pluto is reliable over
1550-2250 and clamped, not extrapolated wildly, outside it.

Six house systems - Placidus, Regiomontanus, Campanus, Porphyry, equal, whole sign.
Beyond the polar circle Placidus is undefined and the calculation falls back to equal
houses, so the chart title names the system actually used rather than the one asked
for. Koch is deliberately absent: its pole definition did not come out of the sources
unambiguously, and an unverified house system is worse than none.

A body's house comes from where the body actually is, by Placidus semi-arc on its real
declination, not from its ecliptic projection. That matters most for Pluto, which
reaches 17.5° of latitude and lands in a different house on about a fifth of charts.

### Progressions and directions

The inner wheel is always natal. The outer ring is one of three things, and the
same slider drives all three, because all three are a function of one moment.

**Transits** - where the sky actually is.

**Secondary progressions** - a day of ephemeris for a year of life. The
progressed moment is birth plus the elapsed tropical years counted as days.
The angles need a rule of their own and the choice matters: casting the
progressed moment as an ordinary chart looks right and is not, because its time
of day drifts through a whole day each year, so its Midheaven circles the zodiac
annually. That is the quotidian method, a real technique but not what
"progressed Ascendant" means to most people. Here the angles move by solar arc,
about a degree a year, and the cusps are rebuilt from that Midheaven.

**Solar arc directions** - every natal body and both angles move by one arc, the
distance the progressed Sun has travelled from the natal Sun. Read against the
natal cusps.

The Moon is a mover in the last two and not in transits: at thirteen degrees a
day it swamps a transit list, while the progressed Moon at a degree a month is
the most used point in the technique. Orbs are capped at one degree for both, or
an aspect would stay "active" for six years and the list would never change.

### Eight languages

English, Spanish, French, Russian, German, Italian, Ukrainian, Georgian - the
same set and the same order as Cinemail. English is the default; the header
control shows only the current language and the rest are in its dropdown; the
choice persists. A key missing from a language falls through to English, so a
partial translation costs one string rather than the screen.

The interpretation corpus is deliberately not translated: it exists in Russian
only, it is switched off, and a machine rendering of it into six languages would
be worse than not offering it. The added translations are not reviewed by native
speakers.

### The time scrubber

One slider moves the transit moment from **seconds to centuries**. The transit ring,
the aspect list and the readout redraw live at about 0.5 ms per chart. The step
selector says how much time one notch is worth; the slider spans sixty notches either
side of an anchor and re-centres on release, so the same travel works at every scale.
Play sweeps continuously. Month and year steps use calendar arithmetic, so 31 January
plus a month is 28 February and not 2 March.

The wheel becomes a bi-wheel while transits are shown: natal inside, transiting bodies
in their own outer band, with dashed chords for hits inside 2°. Each hit is marked
applying or separating, decided by measuring the orb again an hour later rather than
from a table of mean motions, so retrograde loops come out right.

### The city atlas

The whole of GeoNames `cities500`: **235,779 places** down to population 500, with
Russian names taken from `alternateNamesV2` filtered to `isolanguage=ru` and historic
names dropped. Searchable by local name, Russian name or ASCII alias, so Zürich answers
to `zurich`, `zuerich` and `Цюрих`.

It is 6.7 MB of text, about 3.8 MB gzipped, fetched after first paint and then cached
by the service worker. It is deliberately **not** in the critical precache: the app
must boot and cast without it, falling back to an inline seed of the 131 largest
cities. Once it lands, every village works offline like everything else.

Searched as one folded string rather than 235k objects: building objects costs about
90 MB of heap on a phone, while `indexOf` over a blob answers in a few milliseconds
and allocates only for the eight rows shown.

### The chart library

1019 charts - composers, musicians and painters - each with a Rodden rating and a
citable source, plus your own charts saved to this device. Times without a document
are labelled as such and cast for noon, since the Ascendant, the houses and the Moon's
degree mean nothing without a time. Historical entries use local mean time rather than
a zone offset where no zone existed, and pre-1918 Russian and pre-1700 German dates are
stored in the Gregorian calendar.

Your own charts export to plain **CSV** with a header row and import back from it, so
the database opens in a spreadsheet, survives editing by hand, and can be diffed. The
built-in library is not exported; it is not yours to carry off.

### Chart balance

Element, modality and hemisphere tallies. Counts only, no verdict: which element is
short is a fact about the chart, what it means about the person is not.

### Black Moon and Selena

Both were checked rather than assumed.

- **Selena** is a fictitious geocentric body defined in Swiss Ephemeris `seorbel.txt`
  with zero eccentricity and zero inclination, so its longitude *is* its mean anomaly.
  Ours agrees with that definition to 0.006″. There is no more accurate version to
  compute; it is exact relative to its own definition.
- **Mean Black Moon** is the mean lunar apogee, now the full Meeus 45.7 polynomial.
  The previous linear form ran 0.0232° per century fast, which put an arc-minute and a
  half of drift into a 1900 chart and five into a 1600 one.
- **True (osculating) Black Moon** is new and optional: the apogee of the ellipse the
  Moon is actually on at that instant, from the eccentricity vector built out of the
  ELP position and a five-point-stencil velocity. It differs from the mean by up to a
  whole sign and turns retrograde, so it is a different point, not a refinement. The
  stencil is converged (h = 1e-6 and h = 1e-7 agree to under an arc-second) and the
  osculating *a* and *e* stay in their known ranges across four decades of samples.
  Against a published third-party worked example it agrees to about a quarter of a
  degree; a first-party Swiss Ephemeris table to check against exactly has not been
  found.

### Interpretation: switched off, not removed

`FEATURES.interpretation` is `false`. The corpus, every `compose*` function, the
transit prose and the on-device learning model are untouched in the file and come back
by flipping one line.

It is off because the corpus exists in Russian only, so the English build was serving
a four-line stub next to arc-second positions, and because none of it is the reason to
use this app. With the flag off the transit list ranks by receiver rank times exactness
and nothing else, which is a stated rule rather than a private model.

## Tests

Open `test.html` through the same local server. It loads the real `index.html` in an
iframe and calls its functions in that context: nothing is mocked, and a stale build
cannot pass, because the harness clears the service worker and its caches first. That
mattered: before it did, a deliberately broken app passed every check. The runner waits
for the city atlas to finish loading, or the atlas tests would silently check the inline
seed instead.

**124 checks.** Ephemeris against JPL Horizons at 2″ on two anchors and 4″ across the
library, robustness over 1550-2250 and at polar latitudes, house systems (angles land
on the cusps, cusps run round the circle without crossing, quadrant systems coincide at
the equator, zero-latitude bodies get the same house from both methods), library data
quality (chronological order, no calendar-date pile-up, AA entries carry a time and a
source), the Black Moon and Selena checks above, the scrubber's calendar arithmetic,
progressions and directions (the arc, the angle rate, the orb cap), the language
pack (every visible key present in all eight, no language a copy of English),
the atlas, the balance tallies, the CSV round trip including quotes and commas, the
interpretation flag, the bi-wheel's ring separation, contrast against WCAG AA in both
themes, and interface wiring.

The suite is falsified, not just green: reintroducing the sector alpha, collapsing the
MC colour into the aspect colour, and the mean-apogee rate error above all make it fail
by name.

## Known limitations

- Pluto is a fit, valid 1550-2250 and clamped outside.
- No Chiron, no asteroids.
- No synastry, solar returns or composites.
- Primary directions and the quotidian progressed angles are not offered; solar
  arc is the only rule for the angles.
- The interpretation corpus is Russian only, which is why it is switched off.
- Everything lives in one file plus the atlas. That has kept the project free of a
  build step, and it will eventually stop being an advantage.

---

© 2026 Daniel Fainberg (dafaspace). All rights reserved.
Published for transparency, not licensed for reuse or redistribution.

Exception: the three bundled web fonts (`inter-400.woff2`, `inter-500.woff2`,
`literata-500.woff2`) are subsets of Inter and Literata, both under the SIL Open
Font License 1.1. See [OFL.txt](OFL.txt).

The city atlas in `cities.txt` is derived from [GeoNames](https://www.geonames.org/),
licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
