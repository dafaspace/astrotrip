/* Build asteroids.js from JPL Horizons.
 *
 *   node tools-asteroids.mjs            # all four, into asteroids.js
 *   NSEG=390 DEG=12 node tools-asteroids.mjs    # tighter, bigger
 *
 * A clean run prints one line per body with the worst residual in arcseconds
 * and the size written. Anything above one arcsecond means the segment count
 * is too low for that body and should be raised; the file is still written, so
 * check the line before committing it.
 *
 * WHY THIS FILE EXISTS AND WHY IT IS IN THE REPO. It was written twice already,
 * both times in a scratch directory that was cleared before it could be used
 * again. A generator that produces a committed artifact belongs beside the
 * artifact, or the artifact becomes a number nobody can reproduce.
 *
 * WHY THE DATA IS SEPARATE. Swiss Ephemeris ships its asteroids as seas_*.se1,
 * 219 KB per six hundred years for six bodies, in a compressed binary its own
 * reader understands. We cannot use those files - they are licensed with the
 * library - but the packaging decision transfers: asteroid data lives in its
 * own file and loads only when somebody asks for asteroids. This app already
 * does exactly that with cities.txt, which is 7.6 MB.
 *
 * WHY 260 SEGMENTS AND DEGREE 12. Measured on real Horizons data for Ceres
 * rather than reasoned from Chiron's settings:
 *
 *     130 x 16 -> 13.7"      84 KB
 *     260 x 12 ->  0.571"   129 KB      <- chosen
 *     260 x 16 ->  0.019"   168 KB
 *     520 x 12 ->  0.011"   257 KB
 *
 * Half an arcsecond is two orders finer than the app ever displays, and the
 * first guess of "same quarter-orbit-per-segment rule as Chiron" would have
 * cost 340 KB per body for accuracy nobody can see.
 */
import fs from 'fs';

const CACHE_DIR = 'tools-asteroid-cache';
const JD0 = 2305447.5, JD1 = 2542855.5;   // 1600-01-01 to 2250-01-01, as Chiron
const STEP = 4;                            // days between Horizons samples
const NSEG = Number(process.env.NSEG || 260);
const DEG  = Number(process.env.DEG  || 12);
const ASR = Math.PI / 648000;

/* name, Horizons id, prefix used in the generated constants */
const BODIES = [
  ['Ceres',  '1', 'CE'],
  ['Pallas', '2', 'PA'],
  ['Juno',   '3', 'JU'],
  ['Vesta',  '4', 'VE'],
];

/* Meeus 21.4, the same routine the app uses to bring a J2000 fit onto the
   ecliptic of date. The fit is made AFTER precessing, so the result drops
   straight into the planet pipeline with no further rotation. */
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

async function chunk(id, a, b) {
  const q = new URLSearchParams({
    format: 'text', COMMAND: `'${id};'`, OBJ_DATA: 'NO', MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'VECTORS', CENTER: "'@sun'", REF_PLANE: 'ECLIPTIC',
    VEC_TABLE: '1', OUT_UNITS: 'AU-D', CSV_FORMAT: 'YES',
    START_TIME: `'JD${a}'`, STOP_TIME: `'JD${b}'`, STEP_SIZE: `'${STEP} d'`
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

/* Least squares onto the Chebyshev basis. Gaussian elimination with partial
   pivoting; the normal equations are ill-conditioned past about degree 24,
   which is why the degree here is 12 and not higher. */
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

/* Absolute rounding, not significant figures. The high-order coefficients are
   tiny and their leading digits buy nothing; the same trick took Chiron's
   block from 58 KB to 35 KB. */
const round = v => +(Math.round(v / 1e-9) * 1e-9).toPrecision(12);

/* SWEEP=1 measures instead of writing: it prints the worst residual and the
   size for a range of settings, per body, from the cached Horizons data. One
   setting for all four was the first attempt and it was wrong - Juno came out
   at 88 arcseconds where Ceres was at 0.57, because eccentricity decides how
   hard a body is to fit and Juno's is 0.256 against Ceres's 0.076. */
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);
if (process.env.SWEEP) {
  console.log('body     nseg deg    worst"     KB');
  for (const [name] of BODIES) {
    const cache = `${CACHE_DIR}/${name}.json`;
    if (!fs.existsSync(cache)) { console.log(`${name}: no cache, run without SWEEP first`); continue; }
    const all = JSON.parse(fs.readFileSync(cache, 'utf8'));
    all.sort((a, b) => a.jd - b.jd);
    const rows = all.map(r => { const [x, y, z] = toDate(r.x, r.y, r.z, r.jd); return { jd: r.jd, v: [x, y, z] }; });
    for (const [nseg, deg] of [[260, 12], [520, 12], [520, 16], [1040, 12], [1560, 12]]) {
      const SEG = (JD1 - JD0) / nseg; let worst = 0, coefs = 0;
      for (let s = 0; s < nseg; s++) {
        const lo = JD0 + s * SEG, hi = lo + SEG;
        const seg = rows.filter(r => r.jd >= lo - 1e-6 && r.jd <= hi + 1e-6);
        if (seg.length < deg + 2) continue;
        const us = seg.map(r => 2 * (r.jd - lo) / SEG - 1);
        const c = [0, 1, 2].map(k => fit(us, seg.map(r => r.v[k]), deg));
        coefs += 3 * (deg + 1);
        seg.forEach((r, i) => {
          const g = [0, 1, 2].map(k => ev(c[k], us[i]));
          const e = Math.hypot(...g.map((x, k) => x - r.v[k]));
          const arc = e / Math.max(Math.hypot(...r.v) - 1, 1) * 206264.8;
          if (arc > worst) worst = arc;
        });
      }
      console.log(`${name.padEnd(8)} ${String(nseg).padStart(4)} ${String(deg).padStart(3)} `
        + `${worst.toFixed(3).padStart(9)} ${(coefs * 11 / 1024).toFixed(0).padStart(6)}`);
    }
  }
  process.exit(0);
}

const parts = [
  `/* Asteroid ephemerides: Ceres, Pallas, Juno, Vesta.`,
  ` * Generated by tools-asteroids.mjs from JPL Horizons, ${new Date().toISOString().slice(0, 10)}.`,
  ` * Heliocentric rectangular, AU, ecliptic of date, ${NSEG} segments of degree ${DEG}`,
  ` * over 1600-01-01 to 2250-01-01. Loaded only when asteroids are switched on. */`,
  `window.AST_EPH = window.AST_EPH || {};`,
];

for (const [name, id, P] of BODIES) {
  const cache = `${CACHE_DIR}/${name}.json`;
  let all = [];
  if (fs.existsSync(cache)) all = JSON.parse(fs.readFileSync(cache, 'utf8'));
  else {
    const W = (JD1 - JD0) / 7;
    for (let jd = JD0; jd < JD1; jd += W) {
      process.stderr.write(`${name} .`);
      all.push(...await chunk(id, jd.toFixed(1), Math.min(jd + W, JD1).toFixed(1)));
      await new Promise(r => setTimeout(r, 400));
    }
    process.stderr.write('\n');
    fs.writeFileSync(cache, JSON.stringify(all));
  }
  all.sort((a, b) => a.jd - b.jd);
  const rows = all.map(r => { const [x, y, z] = toDate(r.x, r.y, r.z, r.jd); return { jd: r.jd, v: [x, y, z] }; });

  const SEG = (JD1 - JD0) / NSEG;
  const OUT = []; let worst = 0;
  for (let s = 0; s < NSEG; s++) {
    const lo = JD0 + s * SEG, hi = lo + SEG;
    const seg = rows.filter(r => r.jd >= lo - 1e-6 && r.jd <= hi + 1e-6);
    const us = seg.map(r => 2 * (r.jd - lo) / SEG - 1);
    const c = [0, 1, 2].map(k => fit(us, seg.map(r => r.v[k]), DEG));
    OUT.push(c);
    seg.forEach((r, i) => {
      const g = [0, 1, 2].map(k => ev(c[k], us[i]));
      const e = Math.hypot(...g.map((x, k) => x - r.v[k]));
      /* As an angle from about 1 AU away, the pessimistic case. */
      const arc = e / Math.max(Math.hypot(...r.v) - 1, 1) * 206264.8;
      if (arc > worst) worst = arc;
    });
  }
  /* One object on window, not a set of top-level consts. A `const` at the top
     level of a classic script is script-scoped and never becomes a property of
     window, so a loader that looks it up by name finds nothing - which is
     exactly what happened, and what happened to Chiron's constants before it. */
  parts.push(`AST_EPH[${JSON.stringify(name)}]={jd0:${JD0},seg:${SEG},nseg:${NSEG},c:[`
    + OUT.map(sg => '[' + sg.map(c => '[' + c.map(round).join(',') + ']').join(',') + ']').join(',\n')
    + `]};`);
  console.error(`${name.padEnd(7)} worst ${worst.toFixed(3).padStart(7)}"  ${rows.length} samples`);
}
const text = parts.join('\n') + '\n';
fs.writeFileSync('asteroids.js', text);
console.error(`asteroids.js: ${(text.length / 1024).toFixed(0)} KB`);
