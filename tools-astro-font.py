#!/usr/bin/env python3
"""Rebuild the embedded 'Astro' glyph font and write it back into index.html.

    python3 tools-astro-font.py            # rebuild and patch index.html
    python3 tools-astro-font.py --check    # report coverage, change nothing

Why this exists. The app draws its zodiac, planet and aspect symbols in a font
embedded in index.html as a data URL, so that the chart looks the same on every
platform. That font was built by hand once and never written down, and on
30 Sep 2026 it turned out to be missing nine of the code points the app draws:
the four asteroids, the Part of Fortune and all four minor aspects. Those fall
back to whatever the platform has, which on macOS looks fine and on Android is
an empty box. This script makes the build repeatable and the coverage checkable.

Where the glyphs come from, measured rather than assumed. The glyphs already
embedded are byte-identical to two Google faces, both SIL OFL 1.1:

  Noto Sans Symbols    the planets, the twelve signs, the aspects
  Noto Sans Symbols 2  the square, the triangle, the Sun, Selena
  Noto Sans Math       the Part of Fortune and the semisquare only, because
                       Mathematical Operators are in neither of the others

Sources are fetched into tools-font-cache/, which is gitignored. Nothing from
this script but the finished subset ends up in the repository.

What the result must satisfy: every character in GLYPH, SIGN_GLYPH and
ASPECT_GLYPH that is not plain ASCII. The ASCII ones (Asc, MC, Q, bQ) are
deliberately left out - they are letters, and they are rendered by Inter, which
the app already bundles.
"""
import base64, io, os, re, sys, urllib.request, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, 'tools-font-cache')
INDEX = os.path.join(HERE, 'index.html')

# Pinned releases. An unpinned "latest" would silently change the drawing of
# every symbol in the app on a rebuild, which is not a thing to discover from a
# screenshot months later.
SOURCES = [
    ('symbols',  'https://github.com/notofonts/symbols/releases/download/'
                 'NotoSansSymbols-v2.003/NotoSansSymbols-v2.003.zip',
                 'NotoSansSymbols/googlefonts/ttf/NotoSansSymbols-Regular.ttf'),
    ('symbols2', 'https://github.com/notofonts/symbols/releases/download/'
                 'NotoSansSymbols2-v2.008/NotoSansSymbols2-v2.008.zip',
                 'NotoSansSymbols2/googlefonts/ttf/NotoSansSymbols2-Regular.ttf'),
    ('math',     'https://github.com/notofonts/math/releases/download/'
                 'NotoSansMath-v3.000/NotoSansMath-v3.000.zip',
                 'NotoSansMath/googlefonts/ttf/NotoSansMath-Regular.ttf'),
]
# Order matters: the first source that has a code point supplies it. Symbols
# first, because it is where the astrological set actually lives; Math last,
# because its strokes are drawn for equations and are heavier.
ORDER = ['symbols', 'symbols2', 'math']


def wanted_codepoints():
    """Every non-ASCII character the app draws in the Astro family."""
    src = open(INDEX, encoding='utf-8').read()
    cps, where = set(), {}
    for name in ('GLYPH', 'SIGN_GLYPH', 'ASPECT_GLYPH'):
        m = re.search(r'const ' + name + r'\s*=\s*([\[{].*?[\]}]);', src, re.S)
        if not m:
            sys.exit('could not find %s in index.html' % name)
        for ch in re.findall(r"'([^']*)'", m.group(1)):
            for c in ch:
                if ord(c) > 127:
                    cps.add(ord(c))
                    where.setdefault(ord(c), name)
    return cps, where


def fetch(tag, url, member):
    os.makedirs(CACHE, exist_ok=True)
    out = os.path.join(CACHE, tag + '.ttf')
    if not os.path.exists(out):
        print('fetching %s' % tag)
        with urllib.request.urlopen(url) as r:
            z = zipfile.ZipFile(io.BytesIO(r.read()))
        name = next(n for n in z.namelist() if n.endswith(member))
        open(out, 'wb').write(z.read(name))
    return out


def main():
    check_only = '--check' in sys.argv
    from fontTools.ttLib import TTFont
    from fontTools.subset import Subsetter, Options
    from fontTools.pens.ttGlyphPen import TTGlyphPen

    cps, where = wanted_codepoints()
    print('%d code points to cover' % len(cps))

    paths = {tag: fetch(tag, url, member) for tag, url, member in SOURCES}
    covers = {tag: set(TTFont(p).getBestCmap()) for tag, p in paths.items()}

    # Assign each code point to the first source that has it, so no glyph is
    # taken from a heavier face when a lighter one carries it.
    take, orphan = {t: set() for t in ORDER}, []
    for c in sorted(cps):
        for tag in ORDER:
            if c in covers[tag]:
                take[tag].add(c)
                break
        else:
            orphan.append(c)
    for tag in ORDER:
        print('  %-9s %2d glyphs' % (tag, len(take[tag])))
    if orphan:
        print('NOT COVERED BY ANY SOURCE:',
              ', '.join('U+%04X %s (%s)' % (c, chr(c), where[c]) for c in orphan))
        sys.exit(1)

    if check_only:
        cur = re.search(r"font-family:'Astro';\s*src:url\(data:font/woff2;base64,"
                        r"([A-Za-z0-9+/=]+)\)", open(INDEX, encoding='utf-8').read())
        have = set(TTFont(io.BytesIO(base64.b64decode(cur.group(1)))).getBestCmap())
        missing = sorted(cps - have)
        print('embedded font covers %d of %d' % (len(cps) - len(missing), len(cps)))
        if missing:
            print('MISSING:', ', '.join('U+%04X %s (%s)' % (c, chr(c), where[c])
                                        for c in missing))
            sys.exit(1)
        print('ok')
        return

    # The first source becomes the base and keeps its metrics; the others give
    # up outlines only. fontTools' own Merger raises on these three, and merging
    # their metrics is not wanted anyway: one ascender and one descender, taken
    # from the face that supplies most of the drawing.
    #
    # vhea and vmtx are dropped, and that is not housekeeping. A glyph added to
    # glyf, hmtx and cmap but not to vmtx makes the save fail with a KeyError
    # that names _h_m_t_x.py, because table__v_m_t_x inherits from it - so the
    # traceback points at the horizontal metrics, which are fine. The app lays
    # out no vertical text, so the tables go rather than get maintained.
    opt = Options()
    opt.drop_tables += ['GSUB', 'GPOS', 'GDEF', 'MATH', 'DSIG', 'vhea', 'vmtx',
                        'VORG', 'cvt ', 'fpgm', 'prep', 'gasp', 'hdmx', 'VDMX',
                        'LTSH']
    opt.name_IDs, opt.name_legacy, opt.notdef_outline = [], False, False
    opt.recalc_bounds, opt.layout_features = True, []

    base = TTFont(paths[ORDER[0]])
    sub = Subsetter(options=opt)
    sub.populate(unicodes=take[ORDER[0]])
    sub.subset(base)

    upm = base['head'].unitsPerEm
    incoming = []                       # (codepoint, name, glyph, metrics)
    for tag in ORDER[1:]:
        if not take[tag]:
            continue
        src = TTFont(paths[tag])
        if src['head'].unitsPerEm != upm:
            sys.exit('%s is %d units per em against %d - outlines would need '
                     'scaling' % (tag, src['head'].unitsPerEm, upm))
        scm, sgs = src.getBestCmap(), src.getGlyphSet()
        for cp in sorted(take[tag]):
            pen = TTGlyphPen(sgs)          # decomposes composites on the way in
            sgs[scm[cp]].draw(pen)
            incoming.append((cp, 'uni%04X' % cp, pen.glyph(),
                             src['hmtx'].metrics[scm[cp]]))

    # The glyph order is extended before anything is written into the tables.
    # Writing first and reordering after loses the new metrics, because the
    # order change makes fontTools rebuild hmtx from the font it was read from.
    order = base.getGlyphOrder() + [n for _, n, _, _ in incoming]
    base.setGlyphOrder(order)
    base['glyf'].glyphOrder = order
    base['maxp'].numGlyphs = len(order)
    for cp, name, glyph, metrics in incoming:
        base['glyf'].glyphs[name] = glyph
        base['hmtx'].metrics[name] = metrics
        for t in base['cmap'].tables:
            t.cmap[cp] = name
    merged = base
    # The name table is stripped: nothing reads it, it is the largest thing left
    # after the outlines, and the licence is carried by OFL.txt where a person
    # can actually find it.
    merged['name'].names = []
    merged.flavor = 'woff2'
    buf = io.BytesIO()
    merged.save(buf)
    data = buf.getvalue()

    got = set(TTFont(io.BytesIO(data)).getBestCmap())
    if cps - got:
        sys.exit('merge lost: ' + ', '.join('U+%04X' % c for c in sorted(cps - got)))

    b64 = base64.b64encode(data).decode()
    src = open(INDEX, encoding='utf-8').read()
    new, n = re.subn(r"(font-family:'Astro';\s*src:url\(data:font/woff2;base64,)"
                     r"[A-Za-z0-9+/=]+(\))", lambda m: m.group(1) + b64 + m.group(2),
                     src, count=1)
    if n != 1:
        sys.exit('could not find the @font-face block in index.html')

    # The coverage list, taken from the font that was just built rather than
    # from the wish list above, so it cannot claim a glyph the font does not
    # have. The test set reads it; nothing at runtime does.
    covered = ''.join(chr(c) for c in sorted(got) if c > 127)
    esc = ''.join('\\u%04x' % ord(ch) for ch in covered)
    new, n = re.subn(r"(/\* ASTRO-COVERAGE-BEGIN \*/\n)const ASTRO_GLYPHS='[^']*';",
                     lambda m: m.group(1) + "const ASTRO_GLYPHS='" + esc + "';",
                     new, count=1)
    if n != 1:
        sys.exit('could not find the ASTRO-COVERAGE block in index.html')
    open(INDEX, 'w', encoding='utf-8').write(new)
    print('%d glyphs, %d bytes woff2, %d bytes base64 - index.html patched'
          % (len(got), len(data), len(b64)))


if __name__ == '__main__':
    main()
