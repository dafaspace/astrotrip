#!/usr/bin/env python3
"""Draw the AstroTrip icon at 1024 px for the store.

The web icons (../icon-512.png and friends) were drawn by a script in July 2026 that
was not kept, and the App Store needs 1024 x 1024 with no transparency. Stretching
the 512 would soften every edge, so the drawing is redone from measurements of the
512, doubled: an orbit, a central body, and a travelling body that breaks the ring.

    python3 mobile/draw-icon.py

Measured on icon-512.png, 9 Oct 2026, and doubled here:
  ground  #100f17                       (the dark theme's --paper)
  ring    centre 256, centreline r 153, stroke 11, #c57d3c
  centre  r 48, #e7e6ea                 (the dark theme's --ink)
  body    at 42.2 degrees, 158.6 from centre, r 30, #c57d3c
  gap     the ring is cut where it comes within 41 of the body's centre
Drawn at 4x and reduced, which is the anti-aliasing; PIL draws hard edges.
Writes the Android launcher icons too, when the android project exists.
"""
import math, os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))

ground = (0x10, 0x0f, 0x17)
orange = (0xc5, 0x7d, 0x3c)
white  = (0xe7, 0xe6, 0xea)


def motif(size, scale, bg):
    """The drawing on a square of `size` px. `scale` is the motif's size relative
    to the 512 original: 1.0 is the iOS and web icon. `bg` None gives a
    transparent background, for Android's adaptive foreground layer."""
    K = 4
    N = size * K
    k = (size / 512) * K * scale
    clear = (0, 0, 0, 0)
    im = Image.new('RGBA', (N, N), (bg + (255,)) if bg else clear)
    d = ImageDraw.Draw(im)          # fills are written, not blended: a transparent
    c = N / 2                       # disc really cuts a hole
    hole = (ground + (255,)) if bg else clear
    def disc(x, y, r, fill): d.ellipse([x - r, y - r, x + r, y + r], fill=fill)
    r_ring, w = 153 * k, 11 * k
    disc(c, c, r_ring + w / 2, orange + (255,))
    disc(c, c, r_ring - w / 2, hole)
    a = math.radians(42.2)
    bx, by = c + 158.6 * k * math.cos(a), c - 158.6 * k * math.sin(a)
    disc(bx, by, 41 * k, hole)
    disc(bx, by, 30 * k, orange + (255,))
    disc(c, c, 48 * k, white + (255,))
    return im.resize((size, size), Image.LANCZOS)


# iOS and the store: 1024, opaque, the original proportions.
out = os.path.join(HERE, 'assets', 'icon-1024.png')
motif(1024, 1.0, ground).convert('RGB').save(out, optimize=True)
print('wrote', out)

# Android. Legacy square and round icons at the five densities, and the adaptive
# icon's foreground layer. The adaptive layer is 108 dp with only the centre 66 dp
# guaranteed visible under every launcher mask, so the motif - whose outermost
# point, the travelling body, is 188.6 of the 512's 256 half-width - is scaled to
# end on that 33 dp radius: 0.611 x 256 / 188.6 = 0.83 of its iOS size.
RES = os.path.join(HERE, 'android', 'app', 'src', 'main', 'res')
if os.path.isdir(RES):
    dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
    fg_scale = (33 / 54) * 256 / 188.6
    for name, f in dens.items():
        d = os.path.join(RES, 'mipmap-' + name)
        os.makedirs(d, exist_ok=True)
        sq = motif(round(48 * f), 1.0, ground)
        sq.convert('RGB').save(os.path.join(d, 'ic_launcher.png'), optimize=True)
        mask = Image.new('L', (sq.width * 4, sq.height * 4), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, mask.width - 1, mask.height - 1], fill=255)
        rnd = sq.copy(); rnd.putalpha(mask.resize(sq.size, Image.LANCZOS))
        rnd.save(os.path.join(d, 'ic_launcher_round.png'), optimize=True)
        motif(round(108 * f), fg_scale, None).save(os.path.join(d, 'ic_launcher_foreground.png'), optimize=True)
    print('wrote Android mipmaps for', ', '.join(dens))
