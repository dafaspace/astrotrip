"""Fit the mean Black Moon to Swiss Ephemeris's definition of the mean apogee.

    python3 tools-lilith.py        # prints the LILITH_SE line for index.html

Swiss Ephemeris (and so astro.com, ZET and Astro Gold) does not give the mean
apogee as the plain ELP mean element of Meeus 45.7: it corrects it by up to 7'
with a three-year period, the argument 2(F - l). That is a definition, not a
measurement, so it is taken from Swiss Ephemeris itself, used here as an oracle
only: pyswisseph's analytic mean apogee (no ephemeris files needed), sampled
over 1550-2250, minus Meeus, fitted by least squares on the basis written out
in lilithLon (index.html). Half the points fit, half check; measured 15 Oct
2026: 419" before, 1.45" at worst after.
"""
import swisseph as swe, math

def meeus(T):
    return (263.3532465 + T*(4069.0137287 + T*(-0.0103200 + T*(-1/80053 + T/18999000)))) % 360

def basis(T):
    F = 1.627905233371468 + 8433.466158130539*T
    l = 2.3555558982657994 + 8328.691426955555*T
    lp = -0.04312518020812495 + 628.301955168488*T
    D = 5.198466741027443 + 7771.377146811758*T
    x = F - l
    v = [1, T, T*T]
    for k in (2, 4, 6, 8):
        v += [math.sin(k*x), math.cos(k*x), T*math.sin(k*x), T*math.cos(k*x)]
    for y in (lp, 2*D - 2*l, 2*x - lp, 2*x + lp):
        v += [math.sin(y), math.cos(y)]
    return v

rows = []
for k in range(4000):
    jd = 2287195.5 + k*63.9 + 0.137*k
    if jd > 2542855: break
    T = (jd - 2451545)/36525
    a = swe.calc(jd, swe.MEAN_APOG, swe.FLG_MOSEPH | swe.FLG_NONUT)[0][0]
    d = ((a - meeus(T) + 540) % 360 - 180)*3600
    rows.append((T, d))
n = len(basis(0))
M = [[0.0]*(n+1) for _ in range(n)]
for T, y in rows[0::2]:
    v = basis(T)
    for i in range(n):
        for j in range(n): M[i][j] += v[i]*v[j]
        M[i][n] += v[i]*y
for c in range(n):
    p = max(range(c, n), key=lambda r: abs(M[r][c])); M[c], M[p] = M[p], M[c]
    for r in range(n):
        if r != c:
            f = M[r][c]/M[c][c]
            for k in range(c, n+1): M[r][k] -= f*M[c][k]
coef = [M[i][n]/M[i][i] for i in range(n)]
worst = max(abs(y - sum(a*b for a, b in zip(basis(T), coef))) for T, y in rows[1::2])
print('// held-out worst %.2f", before %.1f"' % (worst, max(abs(y) for _, y in rows)))
print('const LILITH_SE=[' + ','.join('%.6g' % c for c in coef) + '];')
