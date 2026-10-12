#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
if ! command -v xcodebuild >/dev/null; then echo "Build on a Mac with Xcode installed."; exit 1; fi
npm ci
npm test
npm run build
npx cap sync ios
node scripts/configure-ios.mjs
node scripts/finalize-ios.mjs
mkdir -p work/ios-build
if [ "${1:-simulator}" = "simulator" ]; then
 xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath work/ios-build CODE_SIGNING_ALLOWED=NO build
 echo "Simulator app: work/ios-build/Build/Products/Debug-iphonesimulator/App.app"
else
 : "${APPLE_TEAM_ID:?Set APPLE_TEAM_ID to your signing team.}"
 xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath work/WhiteHole.xcarchive DEVELOPMENT_TEAM="$APPLE_TEAM_ID" -allowProvisioningUpdates archive
 echo "Signed archive: work/WhiteHole.xcarchive. Open it in Xcode Organizer to distribute."
fi
