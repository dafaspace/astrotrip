/* Measure the app's positions against JPL Horizons, body by body.
 *
 *   node tools-check-jpl.mjs
 *
 * Prints the worst disagreement in arcseconds per body and per era over
 * 1550-2250, in TT (Delta T is checked separately, it is a different
 * question). The reference is Horizons' apparent ecliptic longitude and
 * latitude of date (QUANTITIES 31) for the geocentre, at 64 moments spread
 * over the span with varying time of day. Anyone can repeat it: the moments
 * are in the cache file and the query is below.
 *
 * Measured 15 Oct 2026, after the precision work of that night:
 *   every body within 1.3" over 1550-2250, within 0.6" over 1700-2100.
 * Before it: the Moon 20.9", Neptune 5.8", Uranus 3.7", Pluto 3.0" at 1550.
 */
import fs from 'fs';

const CACHE = 'tools-planet-cache/jpl-check.json';
const BODIES = { Sun: '10', Moon: '301', Mercury: '199', Venus: '299', Mars: '4', Jupiter: '5',
  Saturn: '6', Uranus: '7', Neptune: '8', Pluto: '9', Chiron: "'2060;'" };

async function reference() {
  if (fs.existsSync(CACHE)) return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const jds = Array.from({ length: 64 }, (_, k) => 2287195.5 + k * 3995.37 + (k * 0.137) % 1).filter(j => j < 2542855);
  const out = { jds, bodies: {} };
  for (const [name, id] of Object.entries(BODIES)) {
    const use = name === 'Chiron' ? jds.filter(j => j > 2305447.5) : jds;
    const q = new URLSearchParams({ format: 'text', COMMAND: id, OBJ_DATA: 'NO', MAKE_EPHEM: 'YES',
      EPHEM_TYPE: 'OBSERVER', CENTER: "'500@399'", QUANTITIES: "'31'", TIME_TYPE: 'TT', TLIST_TYPE: 'JD',
      TLIST: use.map(j => j.toFixed(6)).join(' '), CSV_FORMAT: 'YES', ANG_FORMAT: 'DEG', EXTRA_PREC: 'YES' });
    const t = await (await fetch('https://ssd.jpl.nasa.gov/api/horizons.api?' + q)).text();
    const m = t.match(/\$\$SOE([\s\S]*?)\$\$EOE/); if (!m) throw new Error('no data for ' + name);
    out.bodies[name] = { jds: use, vals: m[1].trim().split('\n').map(l => { const f = l.split(',').map(s => s.trim()).filter(Boolean); return [+f[f.length - 2], +f[f.length - 1]]; }) };
  }
  fs.writeFileSync(CACHE, JSON.stringify(out));
  return out;
}

function engine() {
  const html = fs.readFileSync('index.html', 'utf8');
  const a = html.indexOf('const D2R=Math.PI/180'), b = html.indexOf('/* ---------- symbols (embedded OFL font');
  const src = fs.readFileSync('ephemeris.js', 'utf8') + '\n' + fs.readFileSync('planets.js', 'utf8') + '\n'
    + html.slice(a, b) + `
return function geo(name, jdTT){
  const Tc=(jdTT-2451545)/36525, tm=(jdTT-2451545)/365250;
  const [dpsi]=nutation(Tc), E=helioXYZ('ea',tm), V=earthVel(tm);
  return name==='Moon'?moonApparent(Tc,dpsi):apparent(name,tm,dpsi,E,V);
};`;
  return new Function('localStorage', 'document', 'window', 'APP_VERSION', src)({ getItem: () => null, setItem: () => {} }, {}, {}, '');
}

const ref = await reference(), geo = engine();
const as = (a, b) => (((a - b + 540) % 360) - 180) * 3600;
const eras = [[1550, 1700], [1700, 1900], [1900, 2050], [2050, 2251]];
console.log('body       1550-1700 1700-1900 1900-2050 2050-2250   lat');
for (const [name, r] of Object.entries(ref.bodies)) {
  const rows = r.jds.map((jd, i) => { const g = geo(name, jd); return g && { y: 2000 + (jd - 2451545) / 365.25, d: as(g.lon, r.vals[i][0]), b: (g.lat - r.vals[i][1]) * 3600 }; }).filter(Boolean);
  const cols = eras.map(([a, z]) => { const x = rows.filter(q => q.y >= a && q.y < z); return x.length ? Math.max(...x.map(q => Math.abs(q.d))).toFixed(2) : '-'; });
  console.log(name.padEnd(9), cols.map(c => c.padStart(9)).join(' '), Math.max(...rows.map(q => Math.abs(q.b))).toFixed(2).padStart(7));
}
