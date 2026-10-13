# WhiteHole

A quiet nightly habit tracker: open it at night, check in, and go to sleep. Built by **Niwas Repalle** with JavaScript, Capacitor and local-first storage.

Android source and a browser preview are available. iOS source and a WidgetKit extension have passed an unsigned simulator build in GitHub Actions; signed iPhone installation and real-device verification remain pending. The interface uses soft-black grayscale, DM Sans, stacked swipe cards, a dot tracker and a flat habit list.

## What works

- Swipe right to complete, left to skip; undo the last check-in. Screen-reader buttons and keyboard support are provided without visible gesture instructions.
- Daily schedules, weekly targets and monthly targets. Completed period targets leave the nightly deck. New days reset the deck while preserving history.
- Daily grid, weekly progress, monthly calendar, habit detail, history corrections and monthly reflections.
- Create, edit, reorder, pause, archive and restore habits. Schedule changes preserve earlier versions.
- Automatic matching line icons for common goals. Optional server-generated icons for unfamiliar goals; generation runs in the background. Offline fallback and manual override are available.
- Local persistent storage, Excel progress export/share and validated Excel backup restore (legacy JSON imports remain supported). No account is required. Android system backup may also preserve app data depending on phone settings.
- Optional local bedtime notification, quiet haptics, reduced motion, dark/light/system appearance, midnight/2 AM/4 AM day boundary.
- Android home widget and iPhone WidgetKit extension with dots, completion count and a check-in streak. A check-in streak counts honestly reviewed days, including skipped habits; individual habit streaks count completions.

## Try it

For a browser preview, follow **Run locally** below. For an Android test build, open this repository's **Actions → Phone builds**, wait for the Android job to pass, then download the `WhiteHole-Android-preview` artifact and extract its APK. The artifact is a debug-signed test build, not a store release. Transfer it to an Android phone and open it; the phone may ask permission to install from that source. All tracking works offline. No demo history is inserted into your real progress.

On Android, choose Settings → Home widget → Add to home screen, or add WhiteHole through your launcher's widget picker. On iPhone, add the widget through the Home Screen widget gallery after installing a signed build. Tap the widget to open check-in.

Reminders appear as a normal phone notification at the chosen evening time; they never block the app. Enable them in WhiteHole and allow the phone notification permission. Android uses inexact scheduling, so battery policies can delay delivery. Thirty days are scheduled and refreshed whenever the app opens or progress changes. Widgets are snapshots refreshed by the OS, not continuously running screens.

## Run locally

Requires Node 22.12+ (Node 24 recommended).

```sh
npm ci
npm run dev
npm test
npm run build
npm run sync
```

Open the local address printed by Vite. Browser preview supports the whole tracker; native reminders, haptics and home-screen widgets require the installed phone app.

## Android

Open `android/` in Android Studio. Use JDK 21, Android SDK 36 and the included Gradle wrapper. After changing the web app, run `npm run sync`. Build a debug APK with `android/gradlew -p android :app:assembleDebug` (on Windows, `gradlew.bat`). Create your own release keystore before store distribution. The custom widget bridge is registered in MainActivity.

## iPhone

Requires a Mac with Xcode and an Apple signing team. Open `ios/App/App.xcodeproj`. The app uses Swift Package Manager; dependencies resolve from the installed node_modules and Apple's Capacitor package. Select your development team for **App** and **WhiteHoleWidget**. Register the app and extension bundle identifiers and enable their shared App Group `group.app.whitehole.habits` in the Apple developer account. If you change identifiers, update the group in both entitlements and Swift files. App supports iOS 15+; widget extension supports iOS 17+.

The source includes the native bridge, shared app-group storage, extension target, bundled DM Sans and WidgetKit timelines. This Windows workspace cannot compile or sign iOS. Its device behavior remains unverified. The included CI workflow can perform an unsigned simulator build on macOS.

## Custom icons service

Never put a provider key in the mobile app or a `VITE_` variable.

```sh
# Set GEMINI_API_KEY in the server environment, then:
npm run icons:server
```

Development requests are proxied to port 8787. Production phones need a deployed HTTPS backend: set `VITE_ICON_API=https://your-service.example` before building and syncing. Configure `ALLOWED_ORIGINS` for the browser origin plus `https://localhost` (Android) and `capacitor://localhost` (iPhone). The server validates bounded SVG path strings, caches drawings and limits requests per IP. The optional Dockerfile supports deployment with environment secrets. Additional authentication, distributed limits and provider budget controls are needed before a public release.

Creator credit: Made by Niwas Repalle.

Default model: `gemini-3.1-flash-lite`; override with `ICON_MODEL`. A real unfamiliar-goal request succeeded during development. The supplied APK has no hosted icon endpoint or embedded key; common icons work offline and unfamiliar goals receive the neutral fallback until a backend is deployed. Generated drawings can be replaced in the icon picker.

## Verification and release boundary

The automated suite covers tracking, Excel-export, icon-service and iOS-project structure. Earlier development checks included browser flows and an Android debug compilation. Browser checks covered onboarding, touch swipes, undo, tracker edits, habit management, themes, backup download, invalid imports, persistence and narrow screens. Current repository validation is recorded below after the publication check; structural iOS tests are not evidence of an actual iPhone build.

Publication check on **13 October 2026**: clean dependency install, **27/27 automated tests passed**, and the production web build passed. The GitHub Actions workflow builds Android and attempts an unsigned iOS simulator build; its run results are separate from these local checks.

Native notification delivery, widgets and haptics still need real-device testing. iOS needs Mac compilation/signing. Store publication, cloud sync, paid subscriptions and a hosted icon backend are not included. No user data or provider credentials are shipped in this source.

Before release: test both phones across midnight/day cutoff, notification permission denial, app termination, offline mode, backup restore and widget refresh; configure signing, icons backend, store privacy disclosures and support details. App data stays local unless a user exports a backup. Custom icon requests send only the goal title to the configured backend/provider.
