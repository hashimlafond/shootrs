# Xcode Run Destination Report

Date: 2026-07-31

## Issue

Xcode shows:

- `A build only device cannot be used to run this target.`
- `No supported iOS devices are available. Connect a device to run your application or choose a simulated device as the destination.`
- Selected destination: `Any iOS Device (arm64)`.

## Root Cause

The selected destination is a generic build-only destination, not a runnable simulator or connected iPhone.

From the Codex shell, the deeper environment issue is:

```text
xcode-select -p
/Library/Developer/CommandLineTools
```

`xcodebuild` and `simctl` both fail because the active developer directory is Command Line Tools, not full Xcode:

```text
xcode-select: error: tool 'xcodebuild' requires Xcode
xcrun: error: unable to find utility "simctl"
```

No iPhone or iPad appeared in the USB device scan. No installed Xcode app was visible to this shell under `/Applications` or the user Applications folder.

## Project Findings

- Native project exists at `ios/App/App.xcodeproj`.
- Target deployment version: iOS 15.0.
- Bundle ID: `com.shootr.app`.
- Target device family: iPhone and iPad.
- Signing style: Automatic.
- Info.plist permission copy validates.
- Privacy manifest validates.
- Native web assets are present under `ios/App/App/public`.
- Native entrypoint now routes to `/app`.
- Only one current `platform-*.js` bundle remains after sync cleanup.

## Changes Made

- Removed obsolete `UIRequiredDeviceCapabilities` value `armv7` from `ios/App/App/Info.plist`.
- Added `scripts/clean-ios-public.mjs` so stale copied web bundles are removed before Capacitor sync.
- Updated iOS sync scripts in `package.json` to run the cleanup before `cap sync ios`.
- Verified `ios:sync:testflight` completes.
- Added `scripts/run-ios-simulator.mjs`, which selects the latest available iPhone simulator and runs Shootr when full Xcode/simulator tooling is available.

## Commands That Passed

```bash
CI=true pnpm run ios:sync:testflight
plutil -lint ios/App/App/Info.plist ios/App/App/PrivacyInfo.xcprivacy
node --check scripts/clean-ios-public.mjs
node --check scripts/prepare-ios-entry.mjs
```

## Remaining Blocker

Codex cannot launch the simulator from this environment until full Xcode is installed and selected:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

Then verify:

```bash
xcodebuild -version
xcrun simctl list devices available
```

If no simulator appears after selecting Xcode, install a runtime from:

```text
Xcode > Settings > Platforms > iOS
```

Install the latest iOS Simulator runtime supported by your Xcode version.

## Automatic Simulator Run Command

After full Xcode and at least one iPhone simulator runtime are installed:

```bash
cd /Users/hashimlafond/Documents/Codex/2026-05-30/can-you-build-apps/outputs/shooters-la
CI=true pnpm run ios:sync:testflight
node scripts/run-ios-simulator.mjs
```

The helper picks the latest available iPhone simulator, boots it, opens Simulator, and runs:

```bash
cap run ios --target <selected-simulator-udid>
```

## Physical iPhone Status

Not ready from this shell:

- No connected iPhone was detected in the USB scan.
- Physical-device running requires full Xcode selected.
- Signing requires an Apple Developer team selected in Xcode.

Owner action for physical iPhone:

1. Connect iPhone by USB or enable wireless debugging.
2. Trust the Mac on the iPhone.
3. Select your Apple Developer team in Xcode.
4. Select the iPhone destination instead of `Any iOS Device (arm64)`.
5. Press Run.

## Current Launch Status

Shootr has not been launched successfully in a simulator from this shell because no simulator tooling is available until full Xcode is selected. The project-side destination blockers that Codex can safely fix have been addressed.

## Next Recommended Step Toward Internal TestFlight

Install/select full Xcode, install the latest iOS Simulator runtime, then run:

```bash
node scripts/run-ios-simulator.mjs
```

Once simulator launch passes, configure signing in Xcode and run a physical-device smoke test before creating an internal TestFlight archive.
