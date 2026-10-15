/* Put a planet's VSOP87D series into ephemeris.js at a chosen truncation.
 *
 *   node tools-vsop.mjs <path to VSOP87D.mer> me 1e-9
 *
 * The file is the Bureau des Longitudes series from IMCCE,
 * https://ftp.imcce.fr/pub/ephem/planets/vsop87/VSOP87D.mer (910 KB, public).
 * Every term with amplitude at or above the threshold is kept, at full
 * precision; their frequencies are appended to VF, the shared table the
 * series index into. Prints the term count and the size written.
 *
 * WHY MERCURY. Measured 15 Oct 2026 against JPL Horizons over 1550-2250: the
 * truncated series the app shipped was 0.26-0.34" off for Mercury; the full
 * series is 0.099" at worst seen from Mercury's closest approach, and the
 * terms below 1e-9 rad change nothing (0.0990" with all 6,827, 0.0990" with
 * 1,766). What is left is VSOP87's own distance from DE441 and is not a smooth
 * curve a fit could take out. The other planets are fitted to JPL directly
 * (tools-planets.mjs), which Mercury's 88-day orbit makes too large.
 */
import fs from 'fs';

const [file, key, thrArg] = process.argv.slice(2);
if (!file || !key) { console.error('usage: node tools-vsop.mjs <VSOP87D.xxx> <key> [threshold]'); process.exit(2); }
const thr = Number(thrArg || 1e-9);
const S = [[], [], []]; let v = 0, p = 0;
for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
  if (line.includes('VARIABLE')) { v = +line.match(/VARIABLE (\d)/)[1] - 1; p = +line.match(/\*T\*\*(\d)/)[1]; S[v][p] = []; continue; }
  const f = line.trim().split(/\s+/); if (f.length < 5) continue;
  const n = f.length, A = +f[n - 3]; if (A >= thr) S[v][p].push([A, +f[n - 2], +f[n - 1]]);
}
let src = fs.readFileSync('ephemeris.js', 'utf8');
const vfLine = src.match(/^const VF=\[([^\]]*)\];/m); if (!vfLine) throw new Error('no VF in ephemeris.js');
const VF = vfLine[1].split(',').map(Number);
const idx = c => { if (c === 0) return -1; let i = VF.indexOf(c); if (i < 0) { VF.push(c); i = VF.length - 1; } return i; };
let terms = 0;
const enc = S.map(pw => '[' + pw.map(arr => '[' + arr.map(([A, B, C]) => { terms++; return `${A},${B},${idx(C)}`; }).join(',') + ']').join(',') + ']');
const body = `${key}:[${enc.join(',')}]`;
const re = new RegExp(`(^|\\{)${key}:\\[\\[\\[.*$`, 'm');
const m = src.match(re); if (!m) throw new Error('no series for ' + key);
const lineEnd = m[0].endsWith(',') ? ',' : (m[0].endsWith('};') ? '};' : '');
src = src.replace(re, m[1] + body + lineEnd);
src = src.replace(/^const VF=\[[^\]]*\];/m, `const VF=[${VF.join(',')}];`);
fs.writeFileSync('ephemeris.js', src);
console.log(`${key}: ${terms} terms at >= ${thr}, ephemeris.js ${(src.length / 1024).toFixed(0)} KB`);
