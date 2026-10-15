/* Fit MOON_FIX in index.html: the Moon's correction to JPL DE441.
 *
 *   node tools-moon.mjs          # fetch (once, cached), fit, print the constant
 *   CHECK=1 node tools-moon.mjs  # measure the app's Moon against JPL as it is now
 *
 * Paste the printed line over `const MOON_FIX=...` in index.html, then run
 * with CHECK=1: a clean result is a worst error of about 1" over 1550-2250.
 *
 * WHAT IS FITTED. The engine's own apparent Moon, taken from index.html with
 * the correction switched off, against Horizons' apparent ecliptic longitude
 * and latitude of date (QUANTITIES 31) in TT, every 99 hours from 1550 to
 * 2250: about 62,000 moments, 4.125 days apart so the samples do not lock to
 * the lunar month. The residual is fitted by least squares on 1, T, T^2 and
 * T, T^2 times the sine and cosine of a few Delaunay arguments (see
 * MOON_FIX_ARGS). Half the points fit, the other half check, and the check is
 * what is printed.
 *
 * WHY TT AND NOT UT. Delta T is a separate question with its own table; the
 * Moon is fitted where it is only the Moon.
 */
import fs from 'fs';

const CACHE = 'tools-planet-cache/Moon-q31.json';
const JD0 = 2287195.5, JD1 = 2542855.5;

async function horizons() {
  if (fs.existsSync(CACHE)) return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const out = [];
  for (let a = JD0; a < JD1; a += 36525) {
    const b = Math.min(a + 36525, JD1);
    const q = new URLSearchParams({
      format: 'text', COMMAND: "'301'", OBJ_DATA: 'NO', MAKE_EPHEM: 'YES', EPHEM_TYPE: 'OBSERVER',
      CENTER: "'500@399'", QUANTITIES: "'31'", TIME_TYPE: 'TT', START_TIME: `'JD${a.toFixed(1)}'`,
      STOP_TIME: `'JD${b.toFixed(1)}'`, STEP_SIZE: "'99 h'", CSV_FORMAT: 'YES', CAL_FORMAT: 'JD',
      ANG_FORMAT: 'DEG', EXTRA_PREC: 'YES'
    });
    const t = await (await fetch('https://ssd.jpl.nasa.gov/api/horizons.api?' + q)).text();
    const m = t.match(/\$\$SOE([\s\S]*?)\$\$EOE/);
    if (!m) throw new Error('Horizons gave no Moon at JD ' + a);
    for (const l of m[1].trim().split('\n')) {
      const f = l.split(',').map(s => s.trim()).filter(Boolean);
      out.push([+f[0], +f[f.length - 2], +f[f.length - 1]]);
    }
    process.stderr.write('.');
  }
  process.stderr.write('\n');
  if (!fs.existsSync('tools-planet-cache')) fs.mkdirSync('tools-planet-cache');
  fs.writeFileSync(CACHE, JSON.stringify(out));
  return out;
}

/* The engine, straight from the app, so the fit is of exactly what ships. */
function engine(off) {
  let html = fs.readFileSync('index.html', 'utf8');
  if (off) html = html.replace(/const MOON_FIX=\{[\s\S]*?\};/, 'const MOON_FIX={lon:[0],lat:[0]};');
  const a = html.indexOf('const D2R=Math.PI/180'), b = html.indexOf('/* ---------- symbols (embedded OFL font');
  const src = fs.readFileSync('ephemeris.js', 'utf8') + '\n' + fs.readFileSync('planets.js', 'utf8') + '\n'
    + html.slice(a, b) + '\nreturn {moonApparent,nutation};';
  const localStorage = { getItem: () => null, setItem: () => {} };
  return new Function('localStorage', 'document', 'window', 'APP_VERSION', src)(localStorage, {}, {}, '');
}

const ARGS = { lon: ['l', '2D-l', '2D', '2l', "l'", '2F'], lat: ['F', 'l+F', 'l-F', '2D-F'] };
function basis(T, args) {
  const D = 5.198466741027443 + 7771.377146811758 * T, Lp = -0.04312518020812495 + 628.301955168488 * T,
    L = 2.3555558982657994 + 8328.691426955555 * T, F = 1.627905233371468 + 8433.466158130539 * T;
  const A = { l: L, '2D-l': 2 * D - L, '2D': 2 * D, '2l': 2 * L, "l'": Lp, '2F': 2 * F, F, 'l+F': L + F, 'l-F': L - F, '2D-F': 2 * D - F };
  const v = [1, T, T * T];
  for (const k of args) for (const p of [1, 2]) { const tp = T ** p; v.push(tp * Math.sin(A[k]), tp * Math.cos(A[k])); }
  return v;
}
function lsq(rows, args) {           // rows: [T, residual]
  const n = basis(0, args).length, M = Array.from({ length: n }, () => new Float64Array(n + 1));
  for (const [T, r] of rows) { const v = basis(T, args);
    for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) M[i][j] += v[i] * v[j]; M[i][n] += v[i] * r; } }
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}

const ref = await horizons();
const E = engine(!process.env.CHECK);
const as = (a, b) => (((a - b + 540) % 360) - 180) * 3600;
const res = ref.map(([jd, l, b]) => {
  const T = (jd - 2451545) / 36525, [dpsi] = E.nutation(T), m = E.moonApparent(T, dpsi);
  return [T, as(m.lon, l), (m.lat - b) * 3600];
});
const eras = [[1550, 1700], [1700, 1900], [1900, 2050], [2050, 2251]];
const report = (rows, f) => eras.map(([a, z]) => {
  const r = rows.filter(x => { const y = 2000 + x[0] * 100; return y >= a && y < z; }).map(f);
  return `${a}-${z === 2251 ? 2250 : z} ${Math.max(...r.map(Math.abs)).toFixed(2)}/${Math.sqrt(r.reduce((s, x) => s + x * x, 0) / r.length).toFixed(2)}`;
}).join('   ');

if (process.env.CHECK) {
  console.log('app Moon - JPL, worst/rms arcsec by era');
  console.log(' lon ', report(res, x => x[1]));
  console.log(' lat ', report(res, x => x[2]));
  process.exit(0);
}
const train = res.filter((_, i) => i % 2 === 0), test = res.filter((_, i) => i % 2 === 1);
const lon = lsq(train.map(x => [x[0], x[1]]), ARGS.lon), lat = lsq(train.map(x => [x[0], x[2]]), ARGS.lat);
const apply = (c, args, T) => basis(T, args).reduce((s, v, i) => s + v * c[i], 0);
console.error('held-out lon', report(test, x => x[1] - apply(lon, ARGS.lon, x[0])));
console.error('held-out lat', report(test, x => x[2] - apply(lat, ARGS.lat, x[0])));
const r = c => c.map(x => +x.toPrecision(6)).join(',');
console.log(`const MOON_FIX={lon:[${r(lon)}],lat:[${r(lat)}]};`);
