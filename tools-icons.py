"""Draw every app icon from the Astrovarium mark.

    python3 tools-icons.py

The mark is the one in brand/astroverus-mark.svg: the letters A and V drawn as
trines on the ecliptic, turned 5 degrees clockwise, every size by phi (circle
diameter = side / phi, line = radius / phi^6, ring = line / phi, small point =
line * phi / 2, large point = small * phi). No SVG rasteriser is installed on
this Mac, so the geometry is drawn here directly, four times oversized and
reduced, which gives the same antialiasing a rasteriser would.

Writes the web icons, the iOS 1024 icon, and the Android launcher icons: square,
round, and the adaptive foreground, which is drawn smaller because Android
crops the adaptive layer to whatever shape the launcher uses and keeps only
the middle 66 of 108 units safe.

favicon-32.png is the one place the ring is drawn heavier and solid: at 32
pixels the 55 per cent hairline of the large icon is a third of a pixel and
disappears, so a browser tab gets the optical-size variant.
"""
import math
from PIL import Image, ImageDraw

PHI = (1 + 5 ** 0.5) / 2
BG = (16, 15, 23, 255)
GOLD = (188, 119, 58, 255)
INK = (231, 230, 234, 255)
RING = (150, 147, 166)
SS = 4  # supersampling


def mark(size, circle=1 / PHI, background=True, heavy_ring=False, round_mask=False):
    S = size * SS
    C = S / 2
    R = S * circle / 2
    line = R / PHI ** 6
    ring = line / PHI
    small = line * PHI / 2
    big = small * PHI
    if heavy_ring:  # the small-size variant: ring as thick as the letters, solid
        ring = line
    im = Image.new('RGBA', (S, S), BG if background else (0, 0, 0, 0))
    # the ring on its own layer, so its opacity composites like the SVG's
    ring_layer = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring_layer)
    alpha = 255 if heavy_ring else round(255 * .55)
    colour = (179, 176, 194, alpha) if heavy_ring else RING + (alpha,)
    rd.ellipse([C - R - ring / 2, C - R - ring / 2, C + R + ring / 2, C + R + ring / 2],
               outline=colour, width=max(1, round(ring)))
    im.alpha_composite(ring_layer)
    d = ImageDraw.Draw(im)
    rot = 5

    def P(deg):
        a = math.radians(deg + rot - 90)
        return C + R * math.cos(a), C + R * math.sin(a)

    for a, b in [(0, 120), (0, 240), (180, 60), (180, 300)]:
        (x1, y1), (x2, y2) = P(a), P(b)
        d.line([(x1, y1), (x2, y2)], fill=GOLD, width=max(1, round(line)))
        for x, y in ((x1, y1), (x2, y2)):  # round caps
            d.ellipse([x - line / 2, y - line / 2, x + line / 2, y + line / 2], fill=GOLD)
    for deg in (0, 120, 240, 180, 60, 300):
        x, y = P(deg)
        r = big if deg % 180 == 0 else small
        d.ellipse([x - r, y - r, x + r, y + r], fill=INK)
    out = im.resize((size, size), Image.LANCZOS)
    if round_mask:
        m = Image.new('L', (S, S), 0)
        ImageDraw.Draw(m).ellipse([0, 0, S - 1, S - 1], fill=255)
        out.putalpha(m.resize((size, size), Image.LANCZOS))
    return out


def save(im, path):
    im.save(path, optimize=True)
    print('wrote', path, im.size[0])


save(mark(192), 'icon-192.png')
save(mark(512), 'icon-512.png')
save(mark(512), 'icon-maskable-512.png')   # the circle is 62% of the side, inside the 80% safe zone
save(mark(180), 'apple-touch-icon.png')
save(mark(32, heavy_ring=True), 'favicon-32.png')
save(mark(1024).convert('RGB'), 'mobile/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')
RES = 'mobile/android/app/src/main/res/'
for dpi, px in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
    save(mark(px, heavy_ring=px <= 72), f'{RES}mipmap-{dpi}/ic_launcher.png')
    save(mark(px, heavy_ring=px <= 72, round_mask=True), f'{RES}mipmap-{dpi}/ic_launcher_round.png')
    fg = round(px * 108 / 48)
    # 66 of 108 units are safe; the circle with its points stays inside 0.56 of the side
    save(mark(fg, circle=0.56, background=False), f'{RES}mipmap-{dpi}/ic_launcher_foreground.png')
