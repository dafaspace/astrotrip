/* Rebuild MT, the Moon's series in ephemeris.js, from the full ELP2000-82B.
 *
 *   node tools-elp.mjs <path to elp2000-82b.js> [threshold arcsec]
 *
 * The source is Greg Miller's public-domain JavaScript of ELP2000-82B
 * (https://www.celestialprogramming.com/snippets/elp2000-82b/elp2000-82b.js,
 * 3.1 MB, all 37,862 terms of Chapront-Touze and Chapront). It is read as
 * text, never run: each line "a += A[*t[*t]]*Math.sin(phase + k*arg ...)" is
 * parsed into a row of the app's own format,
 *   [coordinate, amplitude, phase, power of t, "slot:multiplier ..."],
 * with the slots of elpArgs in index.html: 0-3 the full Delaunay arguments
 * (main problem), 4-7 their linear parts, 8 the Moon's mean longitude, 9-16
 * the planets Mercury to Neptune.
 *
 * A term is kept when its largest size over 1550-2250 (|t| up to 4.5
 * centuries for the t and t^2 terms) reaches the threshold, in arcseconds for
 * longitude and latitude; distance terms are kept from 0.5 km, since the
 * distance does not move the direction. Prints the count kept.
 */
import fs from 'fs';

const [file, thrArg] = process.argv.slice(2);
if (!file) { console.error('usage: node tools-elp.mjs <elp2000-82b.js> [threshold]'); process.exit(2); }
const thr = Number(thrArg || 0.0005);
const SLOT_FULL = { d: 0, lp: 1, l: 2, f: 3 }, SLOT_LIN = { d: 4, lp: 5, l: 6, f: 7 };
const PL = { p1: 9, p2: 10, p3: 11, p4: 12, p5: 13, p6: 14, p7: 15, p8: 16 };
const W1 = '(3.810344430588308 + 8399.709113522267*t)';

let fn = '', coord = -1, full = false;
const rows = [];
for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
  const h = raw.match(/static (\w+)\(/);
  if (h) { fn = h[1]; coord = /_lon/.test(fn) ? 0 : /_lat/.test(fn) ? 1 : /_r\d*$/.test(fn) ? 2 : -1; full = fn.startsWith('mainproblem'); continue; }
  const m = raw.match(/^\s*a\s*\+=\s*([-0-9.e]+)((?:\*t)*)\*Math\.(sin|cos)\((.*)\);\s*$/);
  if (!m || coord < 0) continue;
  const amp = +m[1], tp = (m[2].match(/\*t/g) || []).length;
  let expr = m[4].replace(/%twopi\)?$/, '').replace(/^\(/, '');
  if (expr.endsWith(')') && !expr.includes(W1)) expr = expr.replace(/\)$/, '');
  let phase = m[3] === 'cos' ? Math.PI / 2 : 0;
  const mults = [];
  /* the mean longitude comes as k*(3.81... + 8399.70...*t) */
  expr = expr.replace(/(-?\d+)\*\(3\.810344430588308 \+ 8399\.709113522267\*t\)\)?/, (_, k) => { mults.push([8, +k]); return '0'; });
  for (let part of expr.split(' + ')) {
    part = part.trim().replace(/^\(/, '').replace(/\)$/, '');
    if (!part || part === '0') continue;
    if (part === 'halfpi') { phase += Math.PI / 2; continue; }
    if (part === '-1*halfpi' || part === '-halfpi') { phase -= Math.PI / 2; continue; }
    const mm = part.match(/^(-?\d+)\*(\w+)$/) || part.match(/^(-?)(\w+)$/);
    if (mm && isNaN(+part)) {
      const k = mm[1] === '-' ? -1 : mm[1] === '' ? 1 : +mm[1], name = mm[2];
      const slot = full ? SLOT_FULL[name] : (SLOT_LIN[name] ?? PL[name]);
      if (slot === undefined) throw new Error('unknown argument ' + name + ' in ' + raw.trim());
      mults.push([slot, k]);
    } else if (!isNaN(+part)) phase += +part;
    else throw new Error('cannot read ' + part + ' in ' + raw.trim());
  }
  rows.push([coord, amp, phase, tp, mults]);
}
const big = r => Math.abs(r[1]) * 4.5 ** r[3];
const rthr = Number(process.env.RTHR ?? 0.5);
const keep = rows.filter(r => r[0] === 2 ? big(r) >= rthr : big(r) >= thr);
const fmt = x => String(+x.toPrecision(12));
const out = 'const MT=[' + keep.map(([c, a, p, tp, ms]) =>
  `[${c},"${fmt(a)}","${fmt(p)}",${tp},"${ms.map(([s, k]) => s + ':' + k).join(' ')}"]`).join(',') + '];';
let src = fs.readFileSync('ephemeris.js', 'utf8');
if (!/^const MT=\[.*\];$/m.test(src)) throw new Error('no MT line in ephemeris.js');
src = src.replace(/^const MT=\[.*\];$/m, () => out);
fs.writeFileSync('ephemeris.js', src);
console.log(`parsed ${rows.length} terms, kept ${keep.length} at ${thr}" (distance 0.5 km), ephemeris.js ${(src.length / 1024).toFixed(0)} KB`);
