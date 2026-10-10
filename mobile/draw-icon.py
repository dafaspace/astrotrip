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
"""
import math, os
from PIL import Image, ImageDraw

S = 1024
K = 4                       # supersampling
N = S * K
k = (S / 512) * K           # from 512 measurements to the working canvas

ground = (0x10, 0x0f, 0x17)
orange = (0xc5, 0x7d, 0x3c)
white  = (0xe7, 0xe6, 0xea)

im = Image.new('RGB', (N, N), ground)
d = ImageDraw.Draw(im)
c = 256 * k

def disc(x, y, r, fill):
    d.ellipse([x - r, y - r, x + r, y + r], fill=fill)

r_ring, w = 153 * k, 11 * k
disc(c, c, r_ring + w / 2, orange)          # the ring as two discs: exact width,
disc(c, c, r_ring - w / 2, ground)          # no stroke-alignment question

a = math.radians(42.2)
bx, by = c + 158.6 * k * math.cos(a), c - 158.6 * k * math.sin(a)
disc(bx, by, 41 * k, ground)                # the break in the ring
disc(bx, by, 30 * k, orange)                # the travelling body
disc(c, c, 48 * k, white)                   # the central body

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'icon-1024.png')
im.resize((S, S), Image.LANCZOS).save(out, optimize=True)
print('wrote', out)
