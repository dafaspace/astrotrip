#!/bin/bash
# Copy the web app into the native bundle, and check what was copied.
#
# The product is ../index.html and the files it loads. This folder only delivers it:
# web build = product logic, Capacitor = delivery shell. Never edit www/ by hand;
# it is regenerated on every run and is not committed.
#
#   ./mobile/sync-web.sh           copy into www/, run `cap copy`, verify
#   ./mobile/sync-web.sh --probe   the same, plus the parity probe (see below). For
#                                  the simulator only - never for a release build
#
# What goes in is a list, and a list is how files go missing: Cinemail shipped a
# bundle that loaded ./qr.js and 404'd on launch because qr.js was added to the web
# app and not to its copy list. So after copying, the script re-reads index.html,
# works out every local file it loads, and stops if any is absent.
#
# What stays out is checked too. A release bundle carries no tests, no tools, no
# golden files and no notes - Dafa's invariant, 29 Sep 2026: "release build does not
# contain dev endpoints, source maps, test charts and diagnostic UI flags".

set -euo pipefail
cd "$(dirname "$0")"

SRC=".."
DST="./www"
PROBE=0
case "${1:-}" in
  --probe) PROBE=1 ;;
  "") ;;
  *) echo "[sync] unknown option: $1" >&2; exit 2 ;;
esac

# What the app loads at runtime, and the font licence, which the OFL requires to
# travel with the fonts. Not the service worker: it is never registered in the
# store build (index.html, NATIVE), and shipping it would only invite a second
# copy of the app. Not manifest.json or the web icons: those are for the browser's
# install prompt, and the store build has its own icon set in Assets.xcassets.
ASSETS=(
  index.html
  ephemeris.js
  asteroids.js
  cities.txt
  inter-400.woff2
  inter-500.woff2
  literata-500.woff2
  OFL.txt
)

rm -rf "$DST"; mkdir -p "$DST"
for f in "${ASSETS[@]}"; do
  [ -f "$SRC/$f" ] || { echo "[sync] FAIL: $SRC/$f is missing" >&2; exit 1; }
  cp "$SRC/$f" "$DST/"
done
echo "[sync] copied ${#ASSETS[@]} files into $DST"

# The parity probe. Dafa's invariant: the same input gives byte-identical ChartFacts
# in the browser and in the iOS build. The probe recomputes the golden digest inside
# the shell, compares it with parity.txt, and prints one line to the console, which
# Capacitor forwards to the app's stdout. It is injected into the copy, never into
# ../index.html, and a release run does not inject it - checked below.
if [ "$PROBE" = "1" ]; then
  cp "$SRC/parity.txt" "$DST/"
  cp ./probe.js "$DST/"
  # The probe has to see the app's top-level const/let, which live in the global
  # lexical scope of the page, so it is loaded as a plain script after the app's.
  # Appended, because index.html has no closing body tag: it ends on its last </script>.
  printf '\n<script src="./probe.js"></script>\n' >> "$DST/index.html"
  grep -q 'src="./probe.js"' "$DST/index.html" || { echo "[sync] FAIL: probe not injected" >&2; exit 1; }
  echo "[sync] probe injected (simulator build only)"
fi

node_modules/.bin/cap copy ios >/dev/null
echo "[sync] cap copy ios: done"

# Verify the bundle Xcode will actually use, not only www/.
node - "$DST" "ios/App/App/public" "$PROBE" <<'CHECK'
const fs=require('fs'), path=require('path');
const [www, pub, probe]=process.argv.slice(2);
const html=fs.readFileSync(path.join(www,'index.html'),'utf8');
const refs=new Set();
const add=p=>{ p=String(p).split('?')[0].split('#')[0].replace(/^\.\//,'');
  if(p && !/^(https?:|data:|blob:|mailto:|capacitor:|#)/.test(p) && !p.includes('${')) refs.add(p); };
for(const m of html.matchAll(/\b(?:src|href)\s*=\s*"([^"]+)"/g)) add(m[1]);
for(const m of html.matchAll(/url\((\.\/[^)'"]+)\)/g)) add(m[1]);
for(const m of html.matchAll(/fetch\(\s*'(\.\/[^']+)'/g)) add(m[1]);
for(const m of html.matchAll(/'(\.\/[a-z0-9_.-]+\.js)\?v=/gi)) add(m[1]);
// Loaded only by the web build, guarded by NATIVE in index.html.
for(const webOnly of ['sw.js','manifest.json','icon-192.png','apple-touch-icon.png']) refs.delete(webOnly);
let bad=0;
for(const dir of [www,pub]){
  const missing=[...refs].filter(p=>!fs.existsSync(path.join(dir,p)));
  if(missing.length){ bad=1; console.error(`[verify] FAIL: ${dir} lacks ${missing.join(', ')}`); }
  else console.log(`[verify] ok: ${dir} has all ${refs.size} files the app loads`);
}
// Nothing that belongs to development, unless this is the probe build.
const forbidden=['test.html','tools-parity.html','tools-parity.sh','tools-asteroids.mjs',
  'tools-astro-font.py','tools-swe-reference.py','swe_reference.json','README.md','MARKET.md','sw.js'];
if(probe!=='1') forbidden.push('parity.txt','probe.js');
for(const dir of [www,pub]){
  const present=forbidden.filter(f=>fs.existsSync(path.join(dir,f)));
  if(present.length){ bad=1; console.error(`[verify] FAIL: ${dir} carries ${present.join(', ')}`); }
  if(probe!=='1' && /probe\.js/.test(fs.readFileSync(path.join(dir,'index.html'),'utf8'))){
    bad=1; console.error(`[verify] FAIL: ${dir}/index.html loads the probe`); }
}
// No hidden road back to the web: the bundle must not load anything from the
// published site. Dafa's invariant: "the app loads only from bundled assets,
// without a hidden fallback to GitHub Pages".
if(/https?:\/\/[^"'\s]*github\.io/.test(html.replace(/<!--[\s\S]*?-->/g,'').replace(/\/\*[\s\S]*?\*\//g,''))){
  bad=1; console.error('[verify] FAIL: index.html references github.io outside a comment'); }
if(!bad) console.log('[verify] ok: no development files, no road back to the published site');
process.exit(bad);
CHECK
echo "[sync] done"
