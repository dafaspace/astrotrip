#!/usr/bin/env bash
# Regenerate parity.txt from the live engine. Run it after any deliberate change
# to the structural layer, read the diff, and commit it as part of that change.
#
#   ./tools-parity.sh
#
# A clean run prints the number of bytes and leaves parity.txt updated. If it
# prints FAILED, the app threw while loading - open tools-parity.html in the
# browser and read the console rather than guessing.
set -euo pipefail
cd "$(dirname "$0")"
PORT=${PORT:-3111}
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
curl -sf "http://localhost:$PORT/index.html" >/dev/null || {
  echo "no server on $PORT - start the dev server first"; exit 1; }
DOM=$("$CHROME" --headless --disable-gpu --virtual-time-budget=20000 \
      --dump-dom "http://localhost:$PORT/tools-parity.html" 2>/dev/null)
BODY=$(python3 - "$DOM" <<'PY'
import sys,html,re
m=re.search(r'BEGIN\n(.*?)\nEND', sys.argv[1], re.S)
print(html.unescape(m.group(1)) if m else '')
PY
)
[ -n "$BODY" ] || { echo "FAILED: no digest in the dumped page"; exit 1; }
python3 - "$BODY" <<'PY'
import sys
body=sys.argv[1]
head=open('parity.txt',encoding='utf-8').read().split('1985-')[0]
open('parity.txt','w',encoding='utf-8').write(head+body+"\n")
print('parity.txt:', len(body), 'bytes of digest')
PY
