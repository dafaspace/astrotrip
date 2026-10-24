#!/usr/bin/env bash
# Build the Android release APK, signed with the key in keys/, and read it back.
#
#   ./mobile/build-apk.sh
#
# The APK is for handing out directly (a file in a chat) during the private test.
# A Play Store upload would be an AAB built from the same project later.
#
# Needs JDK 21 and the Android SDK; on this Mac both come from Homebrew
# (openjdk@21, android-commandlinetools). The first run downloads Gradle and the
# Android libraries, about a gigabyte, so it needs network and takes minutes.

set -euo pipefail
cd "$(dirname "$0")"

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@21}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
[ -x "$JAVA_HOME/bin/java" ] || { echo "no JDK at $JAVA_HOME"; exit 1; }
[ -d "$ANDROID_HOME/platforms" ] || { echo "no Android SDK at $ANDROID_HOME"; exit 1; }
[ -f keys/android-release.properties ] || { echo "no signing key in keys/ - see README"; exit 1; }
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

VERSION=$(grep -o "const APP_VERSION='[0-9.]*'" ../index.html | head -1 | sed "s/.*='//;s/'//")
IFS=. read -r MA MI PA <<< "$VERSION"
BUILD=$(( MA*10000 + ${MI:-0}*100 + ${PA:-0} ))
NAME="Astrovarium-${VERSION}-${BUILD}"
echo "=== ${NAME}.apk ==="

./sync-web.sh | grep -E "^\[(verify|sync)\]" | sed 's/^/  /'
./set-version.sh | sed 's/^/  /'

echo "  building (minutes the first time) ..."
( cd android && ./gradlew --quiet assembleRelease ) > /tmp/astro-apk.log 2>&1 \
  || { echo "  BUILD FAILED"; grep -E "error|FAILED|What went wrong" -A3 /tmp/astro-apk.log | head -20; exit 1; }

mkdir -p build-output
cp android/app/build/outputs/apk/release/app-release.apk "build-output/${NAME}.apk"
APK="build-output/${NAME}.apk"
echo "  ok   $APK ($(du -h "$APK" | cut -f1))"

# Read it back: what a phone will see when the file is opened.
BT=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
"$BT/apksigner" verify --print-certs "$APK" > /tmp/astro-apksig.txt 2>&1 \
  && echo "  ok   signature verifies" || { echo "  FAIL signature"; cat /tmp/astro-apksig.txt; exit 1; }
grep -o "SHA-256 digest: .*" /tmp/astro-apksig.txt | head -1 | sed 's/^/  key  /'
BADGE=$("$BT/aapt2" dump badging "$APK" 2>/dev/null)
echo "$BADGE" | grep -o "package: name='[^']*' versionCode='[^']*' versionName='[^']*'" | sed 's/^/  /'
echo "$BADGE" | grep -o "application-label:'[^']*'" | sed 's/^/  /'
echo "$BADGE" | grep -o "uses-permission: name='[^']*'" | sed 's/^/  /'
# The listing is read into a variable first. Piped straight into grep -q, grep
# exits at the first match, unzip dies writing the rest, and pipefail reports
# that as a failure - which is how the first run said index.html was missing
# from an APK that carried it.
LIST=$(unzip -l "$APK")
grep -q "assets/public/index.html" <<< "$LIST" && echo "  ok   app carries index.html" \
  || { echo "  FAIL no index.html in the APK"; exit 1; }
for f in probe.js parity.txt test.html sw.js; do
  if grep -q "assets/public/$f$" <<< "$LIST"; then echo "  FAIL $f is inside the APK"; exit 1; fi
done
echo "  ok   nothing from development inside"
