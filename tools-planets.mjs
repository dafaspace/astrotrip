/* Build planets.js: Jupiter, Saturn, Uranus and Neptune fitted to JPL DE441.
 *
 *   node tools-planets.mjs           # fetch (once, cached), fit, write planets.js
 *   SWEEP=1 node tools-planets.mjs   # measure settings from the cache, write nothing
 *
 * A clean run prints one line per body with the worst fit residual in
 * arcseconds and the size written.
 *
 * WHY. Measured 15 Oct 2026 against Horizons over 1550-2250, the VSOP87D series
 * the app carries (truncated to keep the file small) were off by up to 5.8" for
 * Neptune, 3.7" for Uranus and about 1" for Jupiter and Saturn. Neptune's error
 * was not noise but a steady drift of about 1.5" a century, which is what a
 * truncated series does when the dropped terms are the slow ones. The cure is
 * the one Pluto and Chiron already have: a piecewise Chebyshev fit to JPL's own
 * solution, which is as good as the fit and costs a few kilobytes for a slow
 * planet.
 *
 * WHY THESE FOUR AND NOT THE INNER PLANETS. The cost of a fit grows with how
 * fast a body moves. Neptune needs a segment every 25 years, Jupiter every 2.5;
 * Mercury would need one every few weeks, megabytes for seven centuries. The
 * inner planets stay on VSOP87D, which for them is already within about 1".
 *
 * WHY THE BARYCENTRES (Horizons 5-8) AND NOT THE PLANETS' CENTRES (599-899).
 * Horizons has the centres only where it has the moons, from 1600 or 1800 on,
 * and the app needs 1550. The barycentre sits within about 300 km of Saturn's
 * centre and less for the others, under 0.05" from Earth, and it is also what
 * VSOP87 itself describes, so nothing that already agreed moves.
 *
 * The fit is made on the ecliptic of date, after precessing with the same
 * routine the app uses, exactly like Pluto, Chiron and the asteroids: the
 * result drops into the planet pipeline with no further rotation. Outside
 * 1550-2250 the app falls back to VSOP87D rather than clamping, because unlike
 * Pluto these four have a series that still works there.
 */
import fs from 'fs';

const CACHE_DIR = 'tools-planet-cache';
const JD0 = 2287195.5, JD1 = 2542855.5;   // 1550-01-01 to 2250-01-01, as Pluto
const ASR = Math.PI / 648000;

/* name, Horizons id, sample step in days, segments, degree, closest approach
   to the Earth in AU (the distance a position error is seen from at worst;
   for the Earth-Moon barycentre it is Venus's, since an error in the Earth
   moves every body by its size seen from there) */
const ALL = [
  /* Mercury is measured but not shipped: its 88-day eccentric orbit needs
     segments of about two weeks, megabytes for seven centuries, and the
     truncated VSOP87D already holds it within 0.34". */
  ['Venus',   '2', 2, 1500, 14, 0.26, 've'],
  ['EMB',     '3', 2, 1500, 12, 0.26, 'ea'],
  ['Mars',    '4', 2, 1200, 12, 0.37, 'ma'],
  ['Jupiter', '5', 5,  560, 12, 1],
  ['Saturn',  '6', 10, 100, 12, 1],
  ['Uranus',  '7', 20,  56, 14, 1],
  ['Neptune', '8', 20,  28, 16, 1],
];
if (process.env.MERCURY) ALL.unshift(['Mercury', '199', 1, 4000, 12, 0.55, 'me']);
const BODIES = ALL.filter(b => !process.env.ONLY || process.env.ONLY.split(',').includes(b[0]));

/* Meeus 21.4, the same routine the app uses (precessEcl in index.html). */
function precessEcl(lon, lat, T) {
  const eta = (47.0029 * T - 0.03302 * T * T + 0.00006 * T ** 3) * ASR;
  const P0 = (174.876384 * 3600 - 869.8089 * T + 0.03536 * T * T) * ASR;
  const p = (5029.0966 * T + 1.11113 * T * T - 0.000006 * T ** 3) * ASR;
  const sP = Math.sin(P0 - lon), cb = Math.cos(lat), sb = Math.sin(lat);
  const A = Math.cos(eta) * cb * sP - Math.sin(eta) * sb;
  const B = cb * Math.cos(P0 - lon);
  const C = Math.cos(eta) * sb + Math.sin(eta) * cb * sP;
  return [p + P0 - Math.atan2(A, B), Math.asin(C)];
}
const toDate = (x, y, z, jd) => {
  const T = (jd - 2451545) / 36525, r = Math.hypot(x, y, z);
  const [l, b] = precessEcl(Math.atan2(y, x), Math.asin(z / r), T);
  return [r * Math.cos(b) * Math.cos(l), r * Math.cos(b) * Math.sin(l), r * Math.sin(b)];
};

async function chunk(id, a, b, step) {
  const q = new URLSearchParams({
    format: 'text', COMMAND: `'${id}'`, OBJ_DATA: 'NO', MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'VECTORS', CENTER: "'@sun'", REF_PLANE: 'ECLIPTIC',
    VEC_TABLE: '1', OUT_UNITS: 'AU-D', CSV_FORMAT: 'YES',
    START_TIME: `'JD${a}'`, STOP_TIME: `'JD${b}'`, STEP_SIZE: `'${step} d'`
  });
  for (let k = 0; k < 5; k++) {
    const t = await (await fetch('https://ssd.jpl.nasa.gov/api/horizons.api?' + q)).text();
    const m = t.match(/\$\$SOE([\s\S]*?)\$\$EOE/);
    if (m) return m[1].trim().split('\n').map(l => {
      const f = l.split(',').map(s => s.trim());
      return { jd: +f[0], x: +f[2], y: +f[3], z: +f[4] };
    }).filter(r => isFinite(r.x));
    await new Promise(r => setTimeout(r, 2000 * (k + 1)));
  }
  throw new Error(`Horizons gave no vectors for ${id} at JD ${a}`);
}

/* Least squares onto the Chebyshev basis, as in tools-asteroids.mjs. */
function fit(ts, v, deg) {
  const n = ts.length, m = deg + 1;
  const B = ts.map(u => { const r = [1, u]; for (let k = 2; k < m; k++) r.push(2 * u * r[k - 1] - r[k - 2]); return r.slice(0, m); });
  const A = Array.from({ length: m }, () => new Float64Array(m)), b = new Float64Array(m);
  for (let i = 0; i < n; i++) for (let p = 0; p < m; p++) {
    b[p] += B[i][p] * v[i];
    for (let q = p; q < m; q++) A[p][q] += B[i][p] * B[i][q];
  }
  for (let p = 0; p < m; p++) for (let q = 0; q < p; q++) A[p][q] = A[q][p];
  const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < m; c++) {
    let pv = c; for (let r = c + 1; r < m; r++) if (Math.abs(M[r][c]) > Math.abs(M[pv][c])) pv = r;
    [M[c], M[pv]] = [M[pv], M[c]];
    for (let r = c + 1; r < m; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= m; k++) M[r][k] -= f * M[c][k]; }
  }
  const o = new Array(m).fill(0);
  for (let r = m - 1; r >= 0; r--) { let s = M[r][m]; for (let k = r + 1; k < m; k++) s -= M[r][k] * o[k]; o[r] = s / M[r][r]; }
  return o;
}
const ev = (c, u) => { let a = 1, b = u, s = c[0] + c[1] * u; for (let k = 2; k < c.length; k++) { const t = 2 * u * b - a; s += c[k] * t; a = b; b = t; } return s; };
const round = v => +(Math.round(v / 1e-9) * 1e-9).toPrecision(12);

/* Fit one body at one setting. The residual is reported as the angle the
   position error makes seen from the Earth at the planet's closest, which is
   the pessimistic case and the one the chart cares about. */
function fitBody(rows, nseg, deg, near = 1) {
  const SEG = (JD1 - JD0) / nseg, out = []; let worst = 0;
  for (let s = 0; s < nseg; s++) {
    const lo = JD0 + s * SEG, hi = lo + SEG;
    const seg = rows.filter(r => r.jd >= lo - 1e-6 && r.jd <= hi + 1e-6);
    if (seg.length < deg + 2) throw new Error(`segment ${s} has ${seg.length} samples`);
    const us = seg.map(r => 2 * (r.jd - lo) / SEG - 1);
    const c = [0, 1, 2].map(k => fit(us, seg.map(r => r.v[k]), deg));
    out.push(c);
    seg.forEach((r, i) => {
      const g = [0, 1, 2].map(k => ev(c[k], us[i]));
      const e = Math.hypot(...g.map((x, k) => x - r.v[k]));
      const arc = e / (near < 1 ? near : Math.max(Math.hypot(...r.v) - 1, 1)) * 206264.8;   // near<1 is set for the inner bodies, so a residual's tiny length is never the divisor
      if (arc > worst) worst = arc;
    });
  }
  return { out, worst, SEG };
}

/* RESID=1 fits not the orbit but JPL minus the app's own VSOP87D for the
   body, taken from index.html: the correction is small, so its coefficients
   are short, and it is all the inner planets need. */
let VSOP = null;
function vsop() {
  if (VSOP) return VSOP;
  const html = fs.readFileSync('index.html', 'utf8');
  const a = html.indexOf('const D2R=Math.PI/180'), b = html.indexOf('/* ---------- symbols (embedded OFL font');
  const src = fs.readFileSync('ephemeris.js', 'utf8') + '\n' + html.slice(a, b) + '\nreturn vsopXYZ;';
  return VSOP = new Function('localStorage', 'document', 'window', 'APP_VERSION', 'PLANET_FIT', src)({ getItem: () => null, setItem: () => {} }, {}, {}, '', undefined);
}
const resid = (rows, k) => rows.map(r => { const p = vsop()(k, (r.jd - 2451545) / 365250); return { jd: r.jd, v: r.v.map((x, i) => x - p[i]) }; });
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);
async function load(name, id, step) {
  const cache = `${CACHE_DIR}/${name}.json`;
  let all = [];
  if (fs.existsSync(cache)) all = JSON.parse(fs.readFileSync(cache, 'utf8'));
  else {
    for (let jd = JD0; jd < JD1; jd += 36525) {
      process.stderr.write(`${name} .`);
      all.push(...await chunk(id, jd.toFixed(1), Math.min(jd + 36525, JD1).toFixed(1), step));
      await new Promise(r => setTimeout(r, 400));
    }
    process.stderr.write('\n');
    const seen = new Set(); all = all.filter(r => !seen.has(r.jd) && seen.add(r.jd));
    fs.writeFileSync(cache, JSON.stringify(all));
  }
  all.sort((a, b) => a.jd - b.jd);
  return all.map(r => ({ jd: r.jd, v: toDate(r.x, r.y, r.z, r.jd) }));
}

if (process.env.SWEEP) {
  console.log('body      nseg deg    worst"     KB');
  for (const [name, id, step, nseg0, deg0, near, vk] of BODIES) {
    let rows = await load(name, id, step);
    if (process.env.RESID) rows = resid(rows, vk);
    const grid = process.env.GRID ? process.env.GRID.split(',').map(x => x.split('x').map(Number))
      : [[0.5, deg0], [1, deg0 - 2], [1, deg0], [2, deg0 - 2], [2, deg0]].map(([f, d]) => [Math.round(nseg0 * f), d]);
    for (const [nseg, deg] of grid) {
      try {
        const { worst } = fitBody(rows, nseg, deg, near);
        console.log(`${name.padEnd(8)} ${String(nseg).padStart(5)} ${String(deg).padStart(3)} `
          + `${worst.toFixed(4).padStart(9)} ${(nseg * 3 * (deg + 1) * 13 / 1024).toFixed(0).padStart(6)}`);
      } catch (e) { console.log(`${name} ${nseg}x${deg}: ${e.message}`); }
    }
  }
  process.exit(0);
}

/* Coefficients are integers in units of 1e-9 AU written in base 36, which is
   half the length of the decimals; the app decodes a body the first time it
   is asked for. The rounding is the same 1e-9 AU as before. */
const parts = [
  `/* Venus, the Earth-Moon barycentre, Mars, Jupiter, Saturn, Uranus and Neptune`,
  ` * fitted to JPL DE441 (public domain). Generated by tools-planets.mjs from`,
  ` * JPL Horizons, ${new Date().toISOString().slice(0, 10)}. Heliocentric rectangular, AU, ecliptic of date,`,
  ` * over 1550-01-01 to 2250-01-01; outside that span the app uses VSOP87D.`,
  ` * Each body: segments of degree deg, x then y then z, base-36 integers of 1e-9 AU. */`,
  `const PLANET_FIT={};`,
];
for (const [name, id, step, nseg, deg, near] of BODIES) {
  const rows = await load(name, id, step);
  const { out, worst, SEG } = fitBody(rows, nseg, deg, near);
  const enc = out.map(sg => sg.map(c => c.map(v => Math.round(v / 1e-9).toString(36)).join(',')).join(',')).join(',\n');
  parts.push(`PLANET_FIT[${JSON.stringify(name)}]={jd0:${JD0},seg:${SEG},nseg:${nseg},deg:${deg},e:\``+enc+`\`};`);
  console.error(`${name.padEnd(8)} worst ${worst.toFixed(4).padStart(8)}"  ${rows.length} samples`);
}
const text = parts.join('\n') + '\n';
fs.writeFileSync('planets.js', text);
console.error(`planets.js: ${(text.length / 1024).toFixed(0)} KB`);
