"""Reference house cusps and house positions from Swiss Ephemeris.

Used as an ORACLE only. The library is not shipped and not linked: it runs here,
on this machine, and what lands in the repo is the numbers it produced. Numbers
are facts, and running a program to read its output does not make our program a
derivative of it. This is the same arrangement we already have with JPL Horizons
for planetary positions - the difference is that Horizons cannot answer anything
about houses, which is precisely the layer that has never been checked against
anything outside this repo.
"""
import swisseph as swe, json

swe.set_ephe_path(None)          # Moshier: no data files, and houses do not use them

SYS = {'placidus':b'P','koch':b'K','regiomontanus':b'R','campanus':b'C',
       'topocentric':b'T','porphyry':b'O','equal':b'A','whole':b'W'}

# Spread over latitude, season and century, because that is where house systems
# differ from each other and from themselves.
CASES = [
    ("1985-03-20 03:30 UT Moscow",   1985,3,20, 3.5,   55.7558, 37.6173),
    ("1990-01-01 09:00 UT Moscow",   1990,1,1,  9.0,   55.75,   37.62),
    ("2000-01-01 00:00 UT equator",  2000,1,1,  0.0,    0.0,     0.0),
    ("1650-06-15 00:00 UT Paris",    1650,6,15, 0.0,   48.8566,  2.3522),
    ("2001-06-21 21:45 UT Tromso",   2001,6,21,21.75,  69.6492, 18.9553),
    ("2200-03-01 00:00 UT Sydney",   2200,3,1,  0.0,  -33.8688,151.2093),
    ("1900-07-04 12:00 UT Quito",    1900,7,4, 12.0,   -0.1807,-78.4678),
    ("1962-11-09 18:20 UT Reykjavik",1962,11,9,18.333, 64.1466,-21.9426),
]

out = {"generator":"pyswisseph "+swe.version, "cases":[]}
for name,y,mo,d,h,lat,lon in CASES:
    jd = swe.julday(y,mo,d,h)
    rec = {"name":name,"y":y,"mo":mo,"d":d,"utHours":h,"lat":lat,"lon":lon,
           "jd_ut":jd,"systems":{}}
    for label,code in SYS.items():
        try:
            cusps, ascmc = swe.houses(jd, lat, lon, code)
        except Exception as e:
            rec["systems"][label] = {"error":str(e)}; continue
        rec["systems"][label] = {
            "cusps":[round(c,6) for c in cusps[:12]],
            "asc":round(ascmc[0],6), "mc":round(ascmc[1],6),
            "armc":round(ascmc[2],6)}
    out["cases"].append(rec)

json.dump(out, open('swe_reference.json','w'), indent=1)
print("wrote swe_reference.json,", len(CASES), "cases x", len(SYS), "systems")
for r in out["cases"][:2]:
    p=r["systems"]["placidus"]
    print(f'  {r["name"]:32} asc {p["asc"]:9.4f}  mc {p["mc"]:9.4f}  c11 {p["cusps"][10]:9.4f}')
