/* Build moon.js: the Moon's correction to JPL DE441.
 *
 *   node tools-moon.mjs           # fetch (once, cached), fit, write moon.js
 *   CHECK=1 node tools-moon.mjs   # measure the app's Moon as it is now
 *
 * WHAT IS FITTED. The engine's own Moon (ELP82B, 6394 terms, from index.html
 * and ephemeris.js with the correction switched off) against Horizons'
 * apparent ecliptic longitude and latitude (QUANTITIES 31), in TT, every two
 * days from 1550 to 2250: 127,827 moments.
 *
 * WHY THE SUN IS SUBTRACTED. Horizons gives positions on its own frame of
 * date, which moves by up to 0.19" at 1962 and 2027 (it adds the observed
 * celestial pole offsets while it has them). That shift is the same for every
 * body, so the target is (app Moon - JPL Moon) - (app Sun - JPL Sun): what is
 * left belongs to the Moon alone, and the fit cannot drag the Moon off the
 * frame the planets are in. The first version fitted the Moon to Horizons
 * directly and took in about 0.1" of that shift.
 *
 * TWO STAGES.
 *  1. MOON_FIX: 1, T, T^2 and T, T^2 times the sine and cosine of six
 *     arguments in longitude and four in latitude - the tidal acceleration
 *     and the slow terms. Held to the edge outside 1550-2250.
 *  2. MOON_CHEB: what remains, as Chebyshev series on 64-day segments of
 *     degree 12, integers of 0.0001" in base 36. None outside the span.
 * Each stage is checked on points it was not fitted to.
 */
import fs from 'fs';

const JD0 = 2287195.87, JD1 = 2542855.5;
const SEG = Number(process.env.SEG || 64), DEG = Number(process.env.DEG || 12), Q = 1e-4;

async function horizons(cmd, file) {
  const cache = `tools-planet-cache/${file}`;
  if (fs.existsSync(cache)) return JSON.parse(fs.readFileSync(cache, 'utf8'));
  const out = [];
  for (let a = JD0; a < JD1; a += 18264.5) {
    const b = Math.min(a + 18262.5, JD1);
    const q = new URLSearchParams({
      format: 'text', COMMAND: `'${cmd}'`, OBJ_DATA: 'NO', MAKE_EPHEM: 'YES', EPHEM_TYPE: 'OBSERVER',
      CENTER: "'500@399'", QUANTITIES: "'31'", TIME_TYPE: 'TT', START_TIME: `'JD${a.toFixed(2)}'`,
      STOP_TIME: `'JD${b.toFixed(2)}'`, STEP_SIZE: "'2 d'", CSV_FORMAT: 'YES', CAL_FORMAT: 'JD',
      ANG_FORMAT: 'DEG', EXTRA_PREC: 'YES' });
    const t = await (await fetch('https://ssd.jpl.nasa.gov/api/horizons.api?' + q)).text();
    const m = t.match(/\$\$SOE([\s\S]*?)\$\$EOE/); if (!m) throw new Error('Horizons gave nothing at JD ' + a);
    for (const l of m[1].trim().split('\n')) { const f = l.split(',').map(s => s.trim()).filter(Boolean); out.push([+f[0], +f[f.length - 2], +f[f.length - 1]]); }
    process.stderr.write('.');
  }
  fs.writeFileSync(cache, JSON.stringify(out));
  return out;
}

/* The engine, straight from the app, positions turned back into Horizons'
   frame (IAU 1976 equinox of date) so that the comparison is of the theory. */
function engine(off) {
  const html = fs.readFileSync('index.html', 'utf8');
  const a = html.indexOf('const D2R=Math.PI/180'), b = html.indexOf('/* ---------- symbols (embedded OFL font');
  const moon = !off && fs.existsSync('moon.js') ? fs.readFileSync('moon.js', 'utf8') : '';
  const src = fs.readFileSync('ephemeris.js', 'utf8') + '\n' + fs.readFileSync('planets.js', 'utf8') + '\n' + moon + '\n'
    + html.slice(a, b) + `
const back=(g,T,dpsi)=>{ const l=g.lon*D2R-dpsi, b=g.lat*D2R; to2006([1,0,0],T);
  const w=mxv(mT(FRAME_M),[Math.cos(b)*Math.cos(l),Math.cos(b)*Math.sin(l),Math.sin(b)]);
  return [rev(Math.atan2(w[1],w[0])*R2D+dpsi*R2D), Math.asin(w[2])*R2D]; };
return T=>{ const [dpsi]=nutation(T), tm=T/10, E=helioXYZ('ea',tm), V=earthVel(tm);
  return {moon:back(moonApparent(T,dpsi),T,dpsi), sun:back(apparent('Sun',tm,dpsi,E,V),T,dpsi)}; };`;
  return new Function('localStorage', 'document', 'window', 'APP_VERSION', src)({ getItem: () => null, setItem: () => {} }, {}, {}, '');
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
function solve(rows, nb, f) {
  const M = Array.from({ length: nb }, () => new Float64Array(nb + 1));
  for (const r of rows) { const v = f(r); for (let i = 0; i < nb; i++) { for (let j = 0; j < nb; j++) M[i][j] += v[i] * v[j]; M[i][nb] += v[i] * r.y; } }
  for (let c = 0; c < nb; c++) {
    let p = c; for (let r = c + 1; r < nb; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < nb; r++) if (r !== c) { const g = M[r][c] / M[c][c]; for (let k = c; k <= nb; k++) M[r][k] -= g * M[c][k]; }
  }
  return M.map((r, i) => r[nb] / r[i]);
}
const cheb = (u, n) => { const r = [1, u]; for (let k = 2; k < n; k++) r.push(2 * u * r[k - 1] - r[k - 2]); return r.slice(0, n); };
const ev = (c, u) => cheb(u, c.length).reduce((s, b, i) => s + b * c[i], 0);
const eras = [[1550, 1700], [1700, 1900], [1900, 2050], [2050, 2251]];
const report = (rows, f) => eras.map(([a, z]) => { const x = rows.filter(r => { const y = 2000 + r.T * 100; return y >= a && y < z; }).map(f);
  return `${a}-${z === 2251 ? 2250 : z} ${Math.max(...x.map(Math.abs)).toFixed(3)}/${Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length).toFixed(3)}`; }).join('  ');

const moonRef = await horizons('301', 'Moon-q31-2d.json'), sunRef = await horizons('10', 'Sun-q31-2d.json');
const E = engine(!process.env.CHECK);
const as = (a, b) => (((a - b + 540) % 360) - 180) * 3600;
const rows = moonRef.map(([jd, l, b], i) => {
  const T = (jd - 2451545) / 36525, g = E(T), s = sunRef[i];
  if (s[0] !== jd) throw new Error('Moon and Sun epochs differ at ' + jd);
  const ds = as(g.sun[0], s[1]), dsb = (g.sun[1] - s[2]) * 3600;
  return { jd, T, lon: as(g.moon[0], l) - ds, lat: (g.moon[1] - b) * 3600 - dsb, raw: as(g.moon[0], l) };
});
if (process.env.CHECK) {
  console.log("app Moon - JPL, the frame shift common to every body taken out; worst/rms arcsec");
  console.log(' lon ', report(rows, r => r.lon));
  console.log(' lat ', report(rows, r => r.lat));
  console.log(' raw lon, frame shift included', report(rows, r => r.raw));
  process.exit(0);
}
/* stage 1 */
const odd = (_, i) => i % 2 === 1, even = (_, i) => i % 2 === 0;
const fix = {};
for (const c of ['lon', 'lat']) {
  const nb = basis(0, ARGS[c]).length;
  fix[c] = solve(rows.filter(even).map(r => ({ T: r.T, y: r[c] })), nb, r => basis(Math.max(-4.5, Math.min(2.5, r.T)), ARGS[c]));
  rows.forEach(r => { r[c + '1'] = r[c] - basis(Math.max(-4.5, Math.min(2.5, r.T)), ARGS[c]).reduce((s, v, i) => s + v * fix[c][i], 0); });
  console.error(`stage 1 ${c} held out: ${report(rows.filter(odd), r => r[c + '1'])}`);
}
/* stage 2, only with STAGE2=1. Tried 15 Oct 2026 on 64-day segments of
   degree 12 from two-day samples and it made the Moon worse, 2.0" on the
   held-out points against 0.18": what remains after stage 1 has periods of a
   few days, two-day samples cannot pin it, and the polynomials swing between
   them. It needs samples every six hours, about a million moments from
   Horizons, and on a 20-year test that reached 0.017". */
let text2 = '';
if (process.env.STAGE2) {
const nseg = Math.floor((JD1 - JD0) / SEG), segLen = (JD1 - JD0) / nseg, enc = { lon: [], lat: [] };
const bySeg = Array.from({ length: nseg }, () => []);
for (const r of rows) { const s = Math.min(nseg - 1, Math.floor((r.jd - JD0) / segLen)); if (s >= 0) bySeg[s].push(r); }
for (const c of ['lon', 'lat']) {
  for (let s = 0; s < nseg; s++) {
    const lo = JD0 + s * segLen, seg = bySeg[s];
    const fitRows = seg.filter((_, i) => i % 3 !== 1);           // every third point held out
    const co = solve(fitRows.map(r => ({ u: 2 * (r.jd - lo) / segLen - 1, y: r[c + '1'] })), DEG + 1, r => cheb(r.u, DEG + 1));
    const qi = co.map(x => Math.round(x / Q));
    enc[c].push(qi.map(x => x.toString(36)).join(','));
    seg.forEach(r => { r[c + '2'] = r[c + '1'] - ev(qi.map(x => x * Q), 2 * (r.jd - lo) / segLen - 1); r.held = r.held || 0; });
    seg.forEach((r, i) => { if (i % 3 === 1) r.held = 1; });
  }
  console.error(`stage 2 ${c} held out: ${report(rows.filter(r => r.held), r => r[c + '2'])}`);
}
text2 = `const MOON_CHEB={jd0:${JD0},seg:${segLen},nseg:${nseg},deg:${DEG},q:${Q},lon:\`${enc.lon.join(',\n')}\`,lat:\`${enc.lat.join(',\n')}\`};`;
}
const r6 = a => a.map(x => +x.toPrecision(6)).join(',');
const text = [
  `/* The Moon's correction to JPL DE441, from tools-moon.mjs, ${new Date().toISOString().slice(0, 10)}.`,
  ` * MOON_FIX: secular and slow terms (see moonFix in index.html), arcseconds.`,
  ` * Fitted to (app Moon - JPL Moon) - (app Sun - JPL Sun), 127,827 moments. */`,
  `const MOON_FIX={lon:[${r6(fix.lon)}],lat:[${r6(fix.lat)}]};`,
].join('\n') + '\n' + (text2 ? text2 + '\n' : '');
fs.writeFileSync('moon.js', text);
console.error(`moon.js: ${(text.length / 1024).toFixed(0)} KB`);
