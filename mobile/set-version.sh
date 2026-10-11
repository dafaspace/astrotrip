#!/bin/bash
# Push the app's version into the iOS project.
#
# The one source of truth is APP_VERSION in ../index.html, the number shown next to
# the title. Everything else is derived, because in Cinemail everything else drifted:
# the app said v0.55.5 while iOS said 1.0, and the store would have shown 1.0 forever.
#
# The build number is an integer the store requires to rise with every upload:
# MAJOR*10000 + MINOR*100 + PATCH, so 3.12.2 is 31202. Holds while minor and patch
# stay under 100.
#
#   ./mobile/set-version.sh           apply
#   ./mobile/set-version.sh --check   show, write nothing

set -euo pipefail
cd "$(dirname "$0")"

VERSION=$(grep -o "const APP_VERSION='[0-9.]*'" ../index.html | head -1 | sed "s/.*='//;s/'//")
[ -n "$VERSION" ] || { echo "[version] no APP_VERSION in ../index.html" >&2; exit 1; }
IFS=. read -r MA MI PA <<< "$VERSION"
BUILD=$(( MA*10000 + ${MI:-0}*100 + ${PA:-0} ))
PBX="ios/App/App.xcodeproj/project.pbxproj"
GRADLE="android/app/build.gradle"

echo "[version] index.html says $VERSION -> build $BUILD"
[ "${1:-}" = "--check" ] && { grep -o 'MARKETING_VERSION = [^;]*;\|CURRENT_PROJECT_VERSION = [^;]*;' "$PBX" | sort -u
  [ -f "$GRADLE" ] && grep -o 'versionCode [0-9]*\|versionName "[^"]*"' "$GRADLE"; exit 0; }

sed -i '' "s/MARKETING_VERSION = [^;]*;/MARKETING_VERSION = $VERSION;/g" "$PBX"
sed -i '' "s/CURRENT_PROJECT_VERSION = [^;]*;/CURRENT_PROJECT_VERSION = $BUILD;/g" "$PBX"

# Read back rather than trust sed: a pattern that matches nothing still exits 0.
got_v=$(grep -o 'MARKETING_VERSION = [^;]*;' "$PBX" | sort -u | sed 's/.*= //;s/;//' | tr '\n' ' ')
got_b=$(grep -o 'CURRENT_PROJECT_VERSION = [^;]*;' "$PBX" | sort -u | sed 's/.*= //;s/;//' | tr '\n' ' ')
[ "$(echo $got_v)" = "$VERSION" ] && [ "$(echo $got_b)" = "$BUILD" ] \
  || { echo "[version] FAIL: project has version '$got_v' build '$got_b'" >&2; exit 1; }
echo "[version] ok: iOS project is $VERSION ($BUILD)"

# Android: the same two numbers under Google's names. versionCode is the integer
# Android uses to decide whether one install may replace another, so it rises with
# every release exactly as the iOS build number does.
if [ -f "$GRADLE" ]; then
  sed -i '' "s/versionCode [0-9]*/versionCode $BUILD/" "$GRADLE"
  sed -i '' "s/versionName \"[^\"]*\"/versionName \"$VERSION\"/" "$GRADLE"
  gc=$(grep -o 'versionCode [0-9]*' "$GRADLE" | sed 's/.* //'); gn=$(grep -o 'versionName "[^"]*"' "$GRADLE" | sed 's/.*"\(.*\)"/\1/')
  [ "$gc" = "$BUILD" ] && [ "$gn" = "$VERSION" ] \
    || { echo "[version] FAIL: Android has versionName '$gn' versionCode '$gc'" >&2; exit 1; }
  echo "[version] ok: Android project is $VERSION ($BUILD)"
fi
