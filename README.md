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
holds outside 1885-2099. Chiron is fitted the same way, from JPL's own solution for
small body 2060. Apparent geocentric positions: light-time, annual aberration,
IAU2000B nutation, IAU 2006 mean obliquity, and Greenwich apparent sidereal time from
the Earth Rotation Angle.

Checked against JPL Horizons on **every chart in the library**: worst disagreement
3.9″ over 1685-1984, under 0.5″ in the twentieth century. Pluto is reliable over
1550-2250 and clamped, not extrapolated wildly, outside it.

Chiron differs from Pluto in two ways, and both are forced by the source rather than
chosen. Its segments are 12.5 years instead of 25, because a 50-year period and an
eccentricity of 0.38 mean a 25-year piece spans half a revolution: at degree 20 the
long segment plateaus at 3.4″ and the short one reaches 0.15″. And it covers 1600-2250
rather than 1550-2250, because JPL has no solution for 2060 Chiron before 1599-12-11.
Outside its span Chiron is **left out of the chart** rather than clamped the way Pluto
is: a chart without Pluto is broken, a chart without Chiron is not, so a glyph frozen
at the edge would be a confident wrong answer for no gain. Measured against Horizons
it stays within 0.32″ from 1700 to 2100, reaching 1.9″ at 2199 - better across the
whole range than the VSOP87D planets, which run 2-4″ out at the same far end.

Chiron is drawn, listed, aspected and tabulated like a body, and stays out of two
places on purpose: the element and modality tally, which counts the ten planets plus
the two angles because that is the one weighting no school argues with, and the
interpretation corpus, which has no text written for it.

### The karmic points are participants

The nodes, Lilith and Selena are drawn on the ring, and until v3.5.0 that was all they
did: `findAspects` looped over the planets, so a Moon exactly conjunct the North Node
had no chord on the wheel, no line in the detail panel, no cell in the grid and no part
in any configuration. Drawn but inert is the worst of the three states, because it reads
as an answer. Reported by Dafa.

They now aspect, form configurations, receive and are received, and carry a dispositor
chain of their own. They still have no essential dignity and rule no house, because they
are outside that scheme rather than missing from it.

They come in on a tighter orb, which is both the usual convention and a measured
necessity: across 60 library charts, letting them use the planets' orbs takes a chart
from 14.4 aspects to 27.5 and the worst case from 25 to 39. Capped at 3 degrees it is
21.4 and 32. The cap is one number and it sits with the other orbs, because it is
exactly the kind of number astrologers disagree about.

### The whole chart as one block of text

A folded card carries every computed fact in one plain-text block with a copy button:
placements with dignity, dispositor chain, houses ruled and where each theme lands,
receptions, every aspect with its orb and whether it applies or separates,
configurations, and the balance. It is meant to be pasted into a language model.

The reason is a real complaint about how astrology is published. Sites give a page per
element, so "Moon in Scorpio" is read on its own and comes out sounding far harsher than
it is in a chart where its dispositor is well placed, where it is received, and where
three other factors pull the other way. The reader is then left to weigh the
contradictions, which is the hard part and the part nobody hands over. Giving a model
the whole evidence set at once is what makes weighing possible; the block opens by
asking for exactly that. What it cannot do is force the model to weigh rather than list.

Copy controls resolve a **named producer**, not a CSS selector. Reading `innerText` off
the rendered card was the first idea and it was wrong: the aspect grid's text form is
"down ☉ ☽ ☿ ♀ ♂ ..." with no pairs and no aspects in it at all. A control that copies
something useless is worse than no control.

### The structural layer

`chartFacts()` computes everything about a chart that follows from a rule and that
nobody argues about: dispositors and their chains, house rulerships and the theme each
ruler carries into the house it occupies, receptions, sect, angularity, solar condition,
intercepted signs. It is a pure function with no DOM and no interpretation, and
deliberately **no scores** - "strong" and "weak" are judgements, and a test asserts that
no field matching `score|strength|weak|strong` exists, because the moment one does the
text layer starts asking for the word "afflicted".

Three limits, stated rather than discovered later. Chains walk the **classical** rulers,
because Pluto rules Scorpio but disposits nothing back into the seven and half the
chains would end on a planet that cannot pass them on; the modern ruler is reported
beside it where they differ. Receptions are by domicile and exaltation only, because
triplicity, term and face each have competing tables and picking one silently would be a
decision dressed as a calculation. House rulership comes from the cusp sign, so the
layer lists which signs are intercepted instead of noting the gap in the abstract.

`parity.txt` holds a golden serialisation of the whole structural layer across six
charts chosen for the paths they exercise. It is the contract between the web build and
the store build: the same six must produce the same text in both, and if they do not,
the wrapper has changed an answer rather than only the way it is delivered. Not a hash,
on purpose - when it differs you want to see where.

Derived facts carry `derivedFrom`. "Moon in Capricorn" and "the Moon's dispositor is
Saturn" are one fact written twice, and anything that later weighs evidence has to be
able to see that or it will over-count, always toward a more confident reading.

Printing adds a **structure sheet**: every body under the same headings, on its own
page, so an astrologer checking the app gets one PDF per chart and can go through the
whole structural layer in a single pass instead of tapping eleven glyphs. The sheet and
the on-screen card build their lines from the same function, and a test compares them
body by body - two copies of that logic would have drifted the first time a label
changed on one side, which is a bill this repo has already paid once, in two apps that
shared button CSS.

Tapping a body on the wheel shows this as a card: the chain, the houses ruled and where
their themes land, who receives it and by what, and its placement. The order is fully
determined - receptions by dignity then by name, houses by number, the chain always
starting at the tapped body - so the same chart renders identically every time. Sections
with nothing to say are omitted rather than printed as "Receptions: none".

Eight house systems - Placidus, Koch, Regiomontanus, Campanus, Topocentric, Porphyry,
equal, whole sign. Beyond the polar circle Placidus and Koch are undefined and the
calculation falls back to equal houses and to Porphyry respectively, so the chart title
names the system actually used rather than the one asked for.

Eight rather than the dozen the desktop tools carry, and the cut is deliberate. A
survey of 500 professional astrologers puts Placidus at 50% and whole sign at 25%, so
those two alone cover three quarters of practice; Regiomontanus is the horary choice
and Koch the German one. Alcabitius, Morinus, Vehlow and the rest each add a line to a
list and serve almost nobody, and an unverified house system is worse than none,
because it looks like a feature and returns wrong cusps that only someone who already
knows the answer can catch.

Koch was absent until 3.1.0 for exactly that reason: its pole definition did not come
out of the secondary sources unambiguously. It is here now because it was taken from
the Swiss Ephemeris reference implementation instead, and both new systems are checked
against a verbatim transcription of that implementation across 1056 samples from 62°S
to 62°N - agreeing to **zero arcseconds**. That comparison is a test, not a one-off.

Koch is also the one system that does not vary its pole: the pole stays the geographic
latitude and the RAMC offset shifts by a third of the Ascendant's ascensional
difference instead. Topocentric is the opposite kind of thing, a one-line definition
whose poles are a third and two thirds of tan(latitude), landing within two degrees of
Placidus across the inhabited world.

A body's house comes from where the body actually is, by Placidus semi-arc on its real
declination, not from its ecliptic projection. That matters most for Pluto, which
reaches 17.5° of latitude and lands in a different house on about a fifth of charts.

### Chart types, and which ring is which

One list: Natal, Transits, Progressions, Directions, Synastry. It names the
chart being drawn rather than the state of a ring, because that is what every
comparable tool calls it and because "empty" described our implementation
rather than the thing chosen.

**The natal chart is always the inner wheel.** Checked rather than assumed, in
three places: Solar Fire places the radix in the inside position automatically,
Astro Gold's help says a bi-wheel is created "with a transits chart in the
outer wheel around the natal chart in the innermost wheel", and LUNA's says
"the radix chart is automatically placed in the inside position" and "the
transit chart is automatically placed in the outer position". The reason is
structural: the inner wheel supplies the houses, so it is the fixed frame, and
what moves against it belongs outside. LUNA does note one nuance worth keeping
- for two radix charts, which is synastry, no order is canonical, and it lets
the user swap the rings.

**The dropdown is the app's own.** A native select opens the platform picker -
a grey iOS wheel in the system font over the top of everything - and six of
them were six holes in the middle of the app. The `<select>` stays in the DOM
as the source of truth, hidden but still the thing every handler listens to,
and a button and listbox are drawn over it. Nothing downstream knows, which is
why all six converted at once: a system applied halfway is worse than none.

### The outer ring is a slot

The inner wheel is always natal. The outer ring is either empty or filled -
with transits, progressions, directions or another person - and filling it is
one question rather than two. Solar Fire asks which charts and
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

### Configurations

Stellium, grand trine, T-square, grand cross, kite, yod and mystic rectangle.
Tapping one lights it on the wheel and dims everything else, which is the only
way a grand cross reads as a shape rather than as four more chords among
twenty.

**Planets only, without the angles or the nodes.** The Ascendant and Midheaven
sit near ninety degrees apart in a great many charts, so admitting them would
manufacture a T-square out of the frame itself; the nodes are always exactly
opposed, so every planet square either one would report another. A figure built
on those is a property of the drawing, not of the chart.

**Orbs are the configured ones.** Many astrologers tighten orbs for patterns.
Doing that here would mean a chord drawn on the wheel and a figure denying it
exists, and one source of truth is worth more than one convention.

**A yod needs the quincunx, which ships off.** That is not a gap: the switch
says do not count this aspect, and an exception for patterns would make the
switch a lie.

Larger figures suppress the smaller ones inside them. A grand cross contains
four T-squares and a kite contains a grand trine; reporting both is the same
fact twice plus noise.

Measured across two hundred library charts, the detector finds T-squares in 98,
stelliums in 74, grand trines in 23, kites and mystic rectangles in 4 each and
grand crosses in 3 - which is the shape of the real distribution and is itself
a test, since a detector broken in either direction would show up here first.

### Relocation

The same instant, a different place. The planets do not move - their positions
are geocentric and do not depend on where you stand - so only the angles, the
houses and everything measured from them change. The new city's timezone is
irrelevant because the moment has not changed, and getting that wrong is the
usual way relocation is implemented badly; a test asserts that every planet is
byte-identical and both angles have moved.

It resets when a new chart is cast. Carrying it over silently would put the
next person's houses in a city they never mentioned.

### Printing

The browser's print dialog is also the PDF export on every platform this runs
on, so the work is the sheet rather than the plumbing. Controls, form, library
and footnote come out; header, wheel, positions, configurations and grid stay;
the collapsed cards are opened first, because a shut `<details>` prints shut.

The dark theme is replaced by an explicit light palette: a printer asked for a
dark wheel returns a black page and an empty cartridge. A test walks every
selector in the print block and fails on any that matches nothing, which is how
`footer` was caught - the app has no `<footer>`, the footnote is a `.foot`, and
that rule had been doing nothing at all. A print rule is invisible until
somebody prints.

### The aspect grid

Ten planets plus the Ascendant and Midheaven. Triangular on its own, because
the upper half would repeat the lower and the diagonal is a body against
itself; rectangular the moment the outer ring is filled, rows being its bodies
and columns yours, which is what a synastry grid is.

Cells carry the mark alone and the orb appears underneath when one is tapped. A
mark plus an orb inside a 24 px cell is two illegible things instead of one
legible one, and the tap also names the pair, which is what a reader loses
track of in a grid.

The grid and the wheel ask the same function whether two degrees aspect, and a
test compares the two lists. A grid that did its own arithmetic would drift
from the wheel eventually and nobody would know which was right.

A grid cell is 24 px, under the 44 px floor, and that is a considered
exception: the grid is a reference table rather than a primary control, every
aspect in it is also a chord on the wheel and a row in the list, and tapping
the wrong neighbour costs one more tap and nothing else.

The nodes, Lilith and Selena are left out. Fourteen rows do not fit a phone,
and those four are what a grid is least often read for.

### Synastry

The fifth entry in the same list, which is the point of having made the outer
ring a slot: another person goes in it exactly where transits or progressions
would, with no new control and no separate mode.

The inner wheel and the houses stay the first person's, because that is what a
bi-wheel means, and the aspects run from the outer chart's planets to the inner
chart's bodies - including its Ascendant, Midheaven, node and Lilith, so "his
Sun on her Ascendant" is found rather than missed.

The partner is chosen by searching, not from a list: the library holds a
thousand charts and a select with a thousand options is not a control. The
search box behaves exactly like the city field, which is the pattern the user
has already used once by the time they reach this.

They are stored as a reference - which list, which id - rather than as a copy,
so a chart corrected in the library is not silently frozen here, and a partner
whose chart has since been deleted degrades to an empty ring rather than
breaking the wheel.

**Either chart can be the inner one.** For two radix charts no order is canonical -
LUNA is the only one of the three that says so out loud, and it lets the user swap the
rings - so this is a choice rather than a default to get right. Swapping moves the
frame and the houses to the other person and reverses the direction the aspects are
read in. The positions, the balance and the configurations stay yours whichever ring
you are drawn in, because those are readings of a single chart. The swap is not
persisted: coming back a week later to find yourself drawn as somebody else's outer
ring would be a puzzle rather than a convenience.

Two things are deliberately absent. **Applying and separating** do not appear,
because neither chart is going anywhere and the label would be meaningless
rather than approximate. **The slider** goes away with them. And the orb is the
one you configured rather than the one-degree cap progressions and directions
get: that cap exists because those move about a degree a year, and synastry
does not move at all.

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

**279 checks.** Ephemeris against JPL Horizons at 2″ on two anchors and 4″ across the
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
