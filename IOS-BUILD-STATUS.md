# WhiteHole iPhone build

An **unsigned iOS simulator app has been compiled by GitHub Actions**. The iOS job in [run 38448277757](https://github.com/niwasrepalle/whitehole/actions/runs/38448277757) passed on 13 October 2026 (UTC). No signed IPA or real-iPhone installation has been produced or verified. The local workspace runs on Windows; the cloud macOS runner performs the simulator compilation.

The project includes the latest app changes, the correct scene-based native widget bridge, one embedded WidgetKit extension, an explicit target dependency, a shared App scheme, DM Sans, app-group entitlements, privacy manifests and app icons. Automated structural checks pass. These checks do not replace Swift compilation or testing on an iPhone.

On a connected Mac, run `bash scripts/build-ios.sh simulator` to compile an unsigned simulator app. The included GitHub Actions workflow does the same on a macOS runner. Download its `WhiteHole-iOS-simulator` artifact to use with a compatible Mac/iOS Simulator; it cannot be installed directly on an iPhone.

To install on an iPhone, configure the signing team for App and WhiteHoleWidget and register their bundle IDs and shared app group. Run `APPLE_TEAM_ID=YOUR_TEAM_ID bash scripts/build-ios.sh archive`, then distribute through Xcode Organizer. TestFlight/App Store distribution additionally requires the user's Apple Developer enrollment and App Store Connect access. The build script uses the account signed into Xcode; no signing secrets are included.

Android's debug APK is compiled and ready for testing. Both apps still require phone-device checks before release. A hosted custom-icons backend remains a separate release dependency; known goal icons work offline.
