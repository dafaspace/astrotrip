#!/usr/bin/env bash
# Build the app for the iOS simulator, install it, launch it, and print what the
# parity probe reports from inside the shell.
#
#   ./mobile/run-sim.sh                    the booted simulator
#   ./mobile/run-sim.sh <device-udid>      a specific one
#
# A good run ends with "[probe] parity ok, N lines identical" and
# "[probe] requests outside the bundle: none". Anything else is the shell
# changing an answer or reaching for the network, and is a bug.
#
# Needs network the first time, to fetch Capacitor's Swift package. Run from a
# normal terminal; inside a sandboxed shell xcodebuild cannot download it and
# waits forever on "Checking out ... capacitor-swift-pm".

set -euo pipefail
cd "$(dirname "$0")"
DEV="${1:-booted}"
BUNDLE="space.dafa.astrotrip"

./sync-web.sh --probe | grep -E "FAIL|probe" || true
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -sdk iphonesimulator -destination "generic/platform=iOS Simulator" \
  -derivedDataPath build-sim build > /tmp/astro-sim-build.log 2>&1 \
  || { grep -E "error:" /tmp/astro-sim-build.log | head -10; exit 1; }
echo "[sim] built"
xcrun simctl install "$DEV" build-sim/Build/Products/Debug-iphonesimulator/App.app
echo "[sim] installed"
LOG=$(mktemp)
xcrun simctl launch --console-pty --terminate-running-process "$DEV" "$BUNDLE" > "$LOG" 2>&1 &
for i in $(seq 1 40); do grep -q "\[probe\] done\|\[probe\] ERROR" "$LOG" && break; sleep 0.5; done
grep -a "\[probe\]" "$LOG" | sed 's/.*\[probe\]/[probe]/'
