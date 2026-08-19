# Native iOS Implementation Plan

Date: 2026-07-31

## Objective

Create a real Capacitor iOS foundation for Shootr internal TestFlight preparation without redesigning the app, adding marketplace features, enabling production payments, or submitting anything to Apple.

## Current Native Architecture

- Framework: Vite web app wrapped by Capacitor.
- Native platform: iOS generated in `ios/`.
- Capacitor version: `@capacitor/core` 8.4.2, `@capacitor/ios` 8.4.2.
- iOS dependency model: Swift Package Manager via `ios/App/CapApp-SPM/Package.swift`.
- App display name: Shootr.
- Bundle identifier currently configured: `com.shootr.app`.
- Minimum iOS version: 15.0.
- Version/build: `MARKETING_VERSION = 1.0`, `CURRENT_PROJECT_VERSION = 1`.
- Web assets source: `dist/`.
- Native app assets: `ios/App/App/Assets.xcassets`.

## Installed Native Plugins

- `@capacitor/app`: app lifecycle and URL open events.
- `@capacitor/browser`: external browser presentation if used later.
- `@capacitor/keyboard`: keyboard behavior in the web view.
- `@capacitor/status-bar`: status bar appearance.

No native Camera, Geolocation, Push Notifications, Apple Pay, Sign in with Apple, Maps, or Stripe plugin is installed in this pass.

## Files Created Or Updated

- `package.json`: added Capacitor dependencies and iOS sync scripts.
- `pnpm-lock.yaml`: updated dependency lockfile.
- `capacitor.config.json`: kept app ID/name/webDir and removed stale plugin permission blocks for uninstalled plugins.
- `.gitignore`: excludes secrets, signing assets, archives, DerivedData, Pods/build outputs, logs, caches.
- `ios/`: generated native iOS project.
- `ios/App/App/Info.plist`: added contextual permission descriptions.
- `ios/App/App/PrivacyInfo.xcprivacy`: added first-party privacy manifest.
- `ios/App/App.xcodeproj/project.pbxproj`: includes privacy manifest in app resources.
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`: replaced with approved Shootr icon asset scaled to 1024px.

## Build Workflow

Use these commands from `outputs/shooters-la/` for local development:

```bash
pnpm install
pnpm run build
./node_modules/.bin/cap sync ios
```

Optional shortcuts:

```bash
npm run ios:sync
npm run ios:open
```

The `ios:sync` script intentionally runs the web build before Capacitor sync so native assets do not silently become stale.

For TestFlight/reviewer assets, use:

```bash
npm run ios:sync:testflight
```

That script sets:

- `VITE_SHOOTR_ENV=testflight`
- `VITE_SHOOTR_DEMO_MODE=false`

## Release Environment Rules

Internal TestFlight must not use local prototype assumptions.

- `settings.demoMode` and `featureFlags.DEMO_MODE` are false when `VITE_SHOOTR_ENV=testflight` or `VITE_SHOOTR_ENV=production`, unless explicitly overridden.
- Release builds must not point at localhost or temporary tunnel URLs.
- Payments remain disabled until server-confirmed sandbox payments exist.
- Push notifications remain disabled until APNs, token lifecycle, and deep-link routing are implemented.
- Native camera/gallery/location prompts must remain contextual and tied to user action.

## Known Native Limitations

- Full Xcode is not selected on this machine, so `xcodebuild`, simulator launch, archive validation, and TestFlight upload could not be performed here.
- Apple Developer team, signing identity, provisioning profile, and App Store Connect app record are owner actions.
- Production backend, auth, payments, moderation, and account deletion remain outside the native wrapper and are still launch blockers.
