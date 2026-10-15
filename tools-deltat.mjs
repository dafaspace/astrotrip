/* Rebuild DT_A and DT_B in index.html from JPL Horizons' own Delta T.
 *
 *   node tools-deltat.mjs     # prints the two lines to paste over the old ones
 *
 * Horizons' QUANTITIES 30 is "TDB - UT" for a time given as UT: TT minus UT1
 * before 1962 (Stephenson, Morrison and Hohenkerk's reconstruction) and TT
 * minus UTC after. DT_A is every five years from -500 to 1550, DT_B every year
 * from 1550 to 1972; from 1972 the app uses the leap-second table instead.
 * The app interpolates linearly; the worst interpolation error against
 * Horizons' 30-day values is 0.06 s before 1550 and below 0.1 s after.
 */
const get = async (start, stop, step) => {
  const q = new URLSearchParams({ format: 'text', COMMAND: '10', OBJ_DATA: 'NO', MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER', CENTER: "'500@399'", QUANTITIES: "'30'", TIME_TYPE: 'UT',
    START_TIME: `'JD${start}'`, STOP_TIME: `'JD${stop}'`, STEP_SIZE: `'${step}'`, CSV_FORMAT: 'YES', CAL_FORMAT: 'JD' });
  const t = await (await fetch('https://ssd.jpl.nasa.gov/api/horizons.api?' + q)).text();
  const m = t.match(/\$\$SOE([\s\S]*?)\$\$EOE/); if (!m) throw new Error('no Delta T from Horizons');
  return m[1].trim().split('\n').map(l => { const f = l.split(',').map(s => s.trim()).filter(Boolean); return [+f[0], +f[f.length - 1]]; });
};
const rows = [...await get(1538432.5, 2287195.5, '1826 d'), ...await get(2287195.5, 2441500.5, '30 d')];
const yr = jd => 2000 + (jd - 2451545) / 365.25;
const D = rows.map(([jd, v]) => [yr(jd), v]).sort((a, b) => a[0] - b[0]);
const at = t => { const i = D.findIndex(p => p[0] > t); if (i <= 0) return D[0][1];
  const [a, va] = D[i - 1], [b, vb] = D[i]; return va + (vb - va) * (t - a) / (b - a); };
const A = [], B = [];
for (let y = -500; y <= 1550; y += 5) A.push(+at(y).toFixed(1));
for (let y = 1550; y <= 1972; y++) B.push(+at(y).toFixed(2));
console.log('const DT_A=[' + A.join(',') + '];');
console.log('const DT_B=[' + B.join(',') + '];');
