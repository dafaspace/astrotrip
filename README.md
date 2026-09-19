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

### The outer ring is a slot

The inner wheel is always natal. The outer ring is either empty or filled, and
filling it is one question rather than two. Solar Fire asks which charts and
then how many rings; on a phone one question is better, and it is the question
already in the reader's head - what am I comparing this against.

**Empty is the default.** A natal chart on its own is what gets looked at first
and most, and the previous default laid a transit ring over it before it had
been read. With the ring empty the slider and the hit list disappear rather
than sitting there inert, and the wheel takes the room they leave.

A list rather than a row of buttons: four labels in eight languages do not fit
across 375 px, and the list has to take synastry later without the control
changing shape.

The three filled options are a function of one moment, so one slider drives
them all.

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

Wheel and control live in one card, sized to fit a phone screen together. A slider a
screen away from the wheel cannot be aimed: you drag, then scroll, then guess.

Dragging is continuous and stepping is exact, which are two different jobs. The drag
interpolates over average unit lengths so the wheel turns smoothly under the finger;
the step buttons and the date fields use calendar arithmetic, so one press of "month"
from 31 January lands on 28 February. Play advances one unit per second measured
against the wall clock, so the sweep runs at the same speed on a 60 Hz phone and a
120 Hz one.

**Picking a body.** Glyph separation is an angle computed from the ring's radius, not
a constant: the 8.5° that kept discs clear at radius 114 leaves 12.7 units between
centres at radius 86, where the discs are 24 across, and they then lie on top of each
other so only the last one drawn can be tapped. The tap target is the ring *wedge*
rather than the disc - the whole sector belonging to the nearest glyph - because a
drawn glyph is 19 px across on a phone and cannot be made bigger without the discs
colliding again. Where planets cluster even a wedge is only about 19 px of arc, which
is the honest limit of fourteen bodies on a 300 px circle, so every body is also a
full-width row in the Positions table, above the 44 px floor and always reliable.

### What the wheel says without being asked

Four things a printed chart has always carried and this one did not.

**Retrograde.** Daily motion is measured, not tabulated: the chart is cast
again six hours either side and the difference is scaled to a day. Six hours is
the compromise - the Moon moves three degrees over it, far above the noise, and
Pluto still moves 36 arc-seconds against a position error of half a second, so
the sign is safe except within a few hours of a station, where no baseline
helps. The mark is the letter ℞, not a colour, so it survives a greyscale print
and a colour-blind reader.

Speed is computed for the natal chart only. Turning it on for the scrubbed
outer ring took a frame from 1.3 ms to 21 ms against a 16.7 ms budget and the
drag stuttered; nothing on the outer ring reads it. A test holds the frame under
budget.

**Where a body actually stands.** A glyph cannot say it: to stop the discs
overlapping they are fanned apart by degrees, so a glyph can sit a sign-sixth
from the body it names. Each body therefore gets a tick at its true longitude
on the degree scale, and those ticks are the only marks on the wheel that are
exact. Inner ticks point inward from the inner ring's scale and outer ticks
outward from the zodiac scale, so the direction says which ring and no legend
is needed.

Each ring reads against a scale of its own at the same remove - the outer ring
16 units inside the zodiac scale, the inner ring 19 inside its own, which it
did not have before. It used to hang 52 units inside a scale that belonged to
the other ring, so its leader lines pointed at marks it had nothing to do with
and a stellium in a sign did not read at all.

The discs are small, about 5% of the wheel's diameter, and legibility won that
trade because the tap target is the ring wedge and no longer the disc.

**Fanning glyphs apart** is a relaxation onto a line, not a walk forward. The
first version pushed each glyph counter-clockwise until it found a free slot,
which in a chart with a stellium carried one 121 degrees from its planet - into
the wrong sign, the wrong house, beside aspects it does not make. That was
visible on screen as the South Node sitting next to the North Node instead of
opposite it. The circle is now cut at its widest gap, spread exactly along the
resulting line and re-centred on the cluster's own centre of mass, so crowding
opens out both ways and is shared. A relaxation that pushed neighbours apart by
half their shortfall was tried first and does not converge: fourteen bodies
inside five degrees were still one degree apart after forty passes.

**Degrees beside every glyph**, and **the cusp degree on its own cusp line**,
both as the ordinal degree every ephemeris prints - 3°30' is the fourth degree
and reads 4. Without them a chart has to be tapped body by body to be read,
which is the difference between a picture and an instrument.

**A header** carrying what the chart was cast from: name, place, date, weekday,
time, UTC offset, coordinates in the `59n55 30e15` form, zodiac, house system
and which Black Moon is in use. A screenshot without it cannot be checked.
Every abbreviation in it exists to keep the block to three lines on a phone,
because the wheel and the slider are budgeted against that screen.

**Checked against ZET 9.** For 3 November 1985, 13:37, GMT+3, 59n55 30e15,
Placidus, all twelve house cusps agree with ZET to the degree, and so does the
Sun. That comparison is a test, and it is the only house-system check in the
suite that uses another program as the reference: our own formulas cannot
confirm our own formulas.

Still missing against ZET, in the order they matter: minor aspects and
configurable orbs, an aspect grid, aspect-pattern figures, Chiron, and printing.

### Aspects and orbs

Eleven aspects: the five majors plus semisextile, semisquare, quintile,
sesquiquadrate, biquintile and quincunx. Each one has a switch and its own orb,
stored per aspect rather than behind a single "minors on" toggle, because an
astrologer who wants the quincunx does not necessarily want the biquintile and
the orb is the part they argue about.

**The minors ship off.** Measured across sixty charts from the library,
switching all six on takes a chart from 11.6 aspects to 16.4, worst case 28.
Not a catastrophe, which is why it is offered; not free either, which is why it
is not the default. Minor chords are drawn in a neutral slate rather than a
fifth family hue, measured at 4.13:1 on the light wheel and 6.09:1 on the dark
one - a plum scored higher on contrast and sat between the axis magenta and the
MC violet, so it lost.

Quintile and biquintile are written `Q` and `bQ` because no symbol for them
exists in Unicode and none exists on paper either; ZET and Solar Fire both
print letters. That keeps one mechanism for all eleven marks - they are all
text characters, none is an image pretending to be one - and a test renders
each against a private-use codepoint to catch any that comes out as a blank
box, since the app has no bundled symbol font and takes these from the system.

An orb typed outside 0.1 to 15 is refused and the field reverts, rather than
being clamped silently: a typed 40 is a mistake and snapping it to 15 hides the
mistake. A value arriving from `localStorage` is clamped, because that is text
someone could have edited and an aspect with a 90 degree orb matches everything.

Switching the minors on found a real bug behind the interpretation flag. The
portrait paragraph took the tightest aspect in the chart and looked its prose
up; the corpus was written for the five majors, so the tightest aspect was
often a quincunx, the lookup returned nothing, and the portrait came back with
an empty body without throwing. It now takes the tightest aspect it can
actually speak about.

### The city atlas

The whole of GeoNames `cities500`: **235,779 places** down to population 500, with
Russian names taken from `alternateNamesV2` filtered to `isolanguage=ru` and historic
names dropped. Searchable by local name, Russian name or ASCII alias, so Zürich answers
to `zurich`, `zuerich` and `Цюрих`.

It is 6.7 MB of text, about 4.2 MB over the wire, fetched after first paint and then
cached by the service worker. It is deliberately **not** in the critical precache: the
app must boot and cast without it, falling back to an inline seed of the 131 largest
cities. Once it lands, every village works offline like everything else.

The download is streamed with a progress bar under the city field, saying what is
being fetched and that it happens once. The denominator is a constant, not the
`Content-Length` header: the file is served gzipped, so the header reports the
compressed size while the stream hands back decompressed bytes, and the bar would run
past 100% and stop. A test fetches the real file and fails with the new number if the
atlas is ever rebuilt. The bar only appears if the download is still going after 350
ms, so a cached repeat visit does not flash it. A failure explains itself and offers a
retry, and a superseded attempt cannot write over a newer one.

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

**174 checks.** Ephemeris against JPL Horizons at 2″ on two anchors and 4″ across the
library, robustness over 1550-2250 and at polar latitudes, house systems (angles land
on the cusps, cusps run round the circle without crossing, quadrant systems coincide at
the equator, zero-latitude bodies get the same house from both methods), library data
quality (chronological order, no calendar-date pile-up, AA entries carry a time and a
source), the Black Moon and Selena checks above, the scrubber's calendar arithmetic,
progressions and directions (the arc, the angle rate, the orb cap), the language
pack (every visible key present in all eight, no language a copy of English),
the atlas and its progress bar, the balance tallies, the CSV round trip including quotes and commas, the
interpretation flag, the bi-wheel's ring separation, glyph overlap in all three ring modes, the wedge tap
and the Positions row target, that wheel and slider share one card and fit one phone
screen, and that dragging stays continuous while stepping stays calendar-exact, contrast against WCAG AA in both
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
