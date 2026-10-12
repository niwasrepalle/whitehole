# WhiteHole iPhone build

The iOS source is packaged, but **no iOS binary or signed IPA has been produced**. This workspace runs on Windows; no Mac runner or Apple signing account is connected.

The project includes the latest app changes, the correct scene-based native widget bridge, one embedded WidgetKit extension, an explicit target dependency, a shared App scheme, DM Sans, app-group entitlements, privacy manifests and app icons. Automated structural checks pass. These checks do not replace Swift compilation or testing on an iPhone.

On a connected Mac, run `bash scripts/build-ios.sh simulator` to compile an unsigned simulator app. The included GitHub Actions workflow does the same on a macOS runner once this source is uploaded to an accessible repository. No repository has been created or workflow dispatched in this session.

To install on an iPhone, configure the signing team for App and WhiteHoleWidget and register their bundle IDs and shared app group. Run `APPLE_TEAM_ID=YOUR_TEAM_ID bash scripts/build-ios.sh archive`, then distribute through Xcode Organizer. TestFlight/App Store distribution additionally requires the user's Apple Developer enrollment and App Store Connect access. The build script uses the account signed into Xcode; no signing secrets are included.

Android's debug APK is compiled and ready for testing. Both apps still require phone-device checks before release. A hosted custom-icons backend remains a separate release dependency; known goal icons work offline.
