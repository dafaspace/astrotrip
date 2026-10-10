#!/usr/bin/env bash
# Build the iOS release, end to end, and check the result rather than trusting it.
#
#   ./mobile/build-ipa.sh             unsigned archive: proves the release builds,
#                                     touches no Apple account
#   ./mobile/build-ipa.sh --signed    archive + export an App Store IPA. Needs Xcode
#                                     signed in to the team in ExportOptions.plist;
#                                     the first run registers space.dafa.astrotrip
#                                     as an App ID in that account
#
# The version comes from APP_VERSION in ../index.html: bump there and nowhere else.
# Cinemail's archive was once made by hand and the method was not kept, so doing it
# again meant working it out again. Every step is here instead.

set -euo pipefail
cd "$(dirname "$0")"

SIGNED=0; [ "${1:-}" = "--signed" ] && SIGNED=1
VERSION=$(grep -o "const APP_VERSION='[0-9.]*'" ../index.html | head -1 | sed "s/.*='//;s/'//")
IFS=. read -r MA MI PA <<< "$VERSION"
BUILD=$(( MA*10000 + ${MI:-0}*100 + ${PA:-0} ))
NAME="AstroTrip-${VERSION}-${BUILD}"
OUT="build-output"
echo "=== ${NAME} $([ $SIGNED = 1 ] && echo signed || echo unsigned) ==="

# 1. The web app, without the probe. sync-web.sh refuses a bundle that carries it.
./sync-web.sh | grep -E "^\[(verify|sync)\]" | sed 's/^/  /'
# 2. The version, into the project.
./set-version.sh | sed 's/^/  /'
# 3. The bundle Xcode will read carries this version. "cap copy said ok" and "the
#    right file is in the .app" have come apart before.
BUNDLED=$(grep -o "const APP_VERSION='[0-9.]*'" ios/App/App/public/index.html | sed "s/.*='//;s/'//")
[ "$BUNDLED" = "$VERSION" ] || { echo "  FAIL bundle carries $BUNDLED, expected $VERSION"; exit 1; }
echo "  ok   bundle carries $VERSION"

rm -rf "${OUT}/${NAME}.xcarchive" "${OUT}/${NAME}"; mkdir -p "$OUT"
echo "  archiving (a few minutes) ..."
if [ $SIGNED = 1 ]; then
  xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
    -destination 'generic/platform=iOS' -archivePath "${OUT}/${NAME}.xcarchive" \
    -allowProvisioningUpdates archive > /tmp/astro-archive.log 2>&1 \
    || { echo "  ARCHIVE FAILED"; grep -E "error:" /tmp/astro-archive.log | head -10; exit 1; }
else
  xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
    -destination 'generic/platform=iOS' -archivePath "${OUT}/${NAME}.xcarchive" \
    CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" \
    archive > /tmp/astro-archive.log 2>&1 \
    || { echo "  ARCHIVE FAILED"; grep -E "error:" /tmp/astro-archive.log | head -10; exit 1; }
fi
echo "  ok   archived: ${OUT}/${NAME}.xcarchive"

# 4. Read the archive back: what a reviewer and a stranger's phone will see.
APP="${OUT}/${NAME}.xcarchive/Products/Applications/App.app"
P="$APP/Info.plist"
pb(){ /usr/libexec/PlistBuddy -c "Print $1" "$P" 2>/dev/null || echo "-"; }
echo "  bundle   $(pb CFBundleIdentifier)"
echo "  version  $(pb CFBundleShortVersionString) ($(pb CFBundleVersion))"
echo "  name     $(pb CFBundleDisplayName)"
[ "$(pb ITSAppUsesNonExemptEncryption)" = "false" ] && echo "  ok   no export-compliance question" \
  || echo "  CHECK ITSAppUsesNonExemptEncryption is not false"
# No permission strings: the app asks for nothing, and a stray one invites a
# reviewer to look for the feature that uses it.
# grep exits 1 on no match - which is the right answer here - and set -e would
# stop the script on it, so the miss is allowed explicitly.
USAGE=$(/usr/libexec/PlistBuddy -c Print "$P" | { grep -o 'NS[A-Za-z]*UsageDescription' || true; } | sort -u | tr '\n' ' ')
[ -z "$USAGE" ] && echo "  ok   no permission prompts" || echo "  CHECK permission strings present: $USAGE"
PUB="$APP/public"
for f in index.html ephemeris.js asteroids.js cities.txt OFL.txt; do
  [ -f "$PUB/$f" ] || { echo "  FAIL $f missing from the built app"; exit 1; }
done
for f in probe.js parity.txt test.html sw.js; do
  [ ! -e "$PUB/$f" ] || { echo "  FAIL $f is inside the built app"; exit 1; }
done
echo "  ok   app carries the product and nothing from development"
echo "  size     $(du -sh "$APP" | cut -f1)"

[ $SIGNED = 1 ] || { echo; echo "Unsigned archive: it proves the release builds; it cannot be uploaded."; exit 0; }

# 5. Export. This is the step that re-signs with Apple Distribution and sets
#    get-task-allow to false; uploading the archive's own .app is the classic mistake.
xcodebuild -exportArchive -archivePath "${OUT}/${NAME}.xcarchive" -exportPath "${OUT}/${NAME}" \
  -exportOptionsPlist ExportOptions.plist -allowProvisioningUpdates > /tmp/astro-export.log 2>&1 \
  || { echo "  EXPORT FAILED"; grep -E "error:" /tmp/astro-export.log | head -10; exit 1; }
IPA=$(find "${OUT}/${NAME}" -name "*.ipa" | head -1)
mv "$IPA" "${OUT}/${NAME}.ipa"; rm -rf "${OUT}/${NAME}"
AUTH=$(codesign -dvvv "${OUT}/${NAME}.xcarchive/Products/Applications/App.app" 2>&1 | grep '^Authority=' | head -1)
echo "  ok   ${OUT}/${NAME}.ipa ($(du -h "${OUT}/${NAME}.ipa" | cut -f1)), archive $AUTH"
echo "Upload with Transporter, or Xcode > Organizer > Distribute App."
