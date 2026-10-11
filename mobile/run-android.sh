#!/usr/bin/env bash
# Build a debug APK with the parity probe, install it on the running emulator or a
# connected phone, launch it, and print what the probe reports from inside.
#
#   ./mobile/run-android.sh
#
# A good run ends with "[probe] parity ok, N lines identical" and
# "[probe] requests outside the bundle: none". The debug APK is signed with the
# SDK's debug key, never the release one, and must not be handed out.
#
# Start the emulator first:
#   emulator -avd astrotrip-test -no-snapshot -no-audio -no-boot-anim

set -euo pipefail
cd "$(dirname "$0")"
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@21}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
ADB="$ANDROID_HOME/platform-tools/adb"
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
"$ADB" get-state >/dev/null 2>&1 || { echo "no device - start the emulator first"; exit 1; }

./sync-web.sh --probe | grep -E "FAIL|probe" || true
( cd android && ./gradlew --quiet assembleDebug ) > /tmp/astro-apk-debug.log 2>&1 \
  || { grep -E "error|What went wrong" -A3 /tmp/astro-apk-debug.log | head -20; exit 1; }
echo "[android] built"
# A release build signed with the other key would refuse this install; uninstall
# first only when the signatures differ, so app data survives ordinary reruns.
"$ADB" install -r android/app/build/outputs/apk/debug/app-debug.apk >/dev/null 2>&1 \
  || { "$ADB" uninstall space.dafa.astrotrip >/dev/null 2>&1; "$ADB" install android/app/build/outputs/apk/debug/app-debug.apk >/dev/null; }
echo "[android] installed"
"$ADB" logcat -c
"$ADB" shell am start -W -n space.dafa.astrotrip/.MainActivity >/dev/null
for i in $(seq 1 40); do "$ADB" logcat -d | grep -q "\[probe\] done\|\[probe\] ERROR" && break; sleep 0.5; done
"$ADB" logcat -d | grep -o "\[probe\].*" | sed 's/", source.*//; s/" *$//'
# Leave the release bundle as it should be: the probe is only ever in debug.
./sync-web.sh >/dev/null
