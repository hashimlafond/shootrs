# Xcode Run Destination Report

Date: 2026-07-30

## Issue

Xcode showed:

- `A build only device cannot be used to run this target.`
- `No supported iOS devices are available. Connect a device to run your application or choose a simulated device as the destination.`
- Selected destination: `Any iOS Device (arm64)`.

## Root Cause

The selected Xcode destination was a generic build-only destination, not a runnable simulator or connected iPhone.

The local machine is using Xcode beta, but the command-line developer directory was still pointed at Command Line Tools:

```text
/Library/Developer/CommandLineTools
```

That meant simulator tooling was unavailable until the Xcode beta developer directory was supplied explicitly.

The usable Xcode beta was found here:

```text
/Users/hashimlafond/Downloads/Xcode-beta.app/Contents/Developer
```

Global `xcode-select` was not changed because it requires the owner's macOS password. The simulator run now works by passing `DEVELOPER_DIR` directly.

## Environment Verified

- Xcode beta found: `Xcode 27.0`, build `27A5228h`.
- Installed simulator runtime: iOS 27.0.
- Available runnable simulator selected: iPhone 17 Pro.
- Simulator UDID: `68B2633B-43A8-4213-9B62-6F9B1803C341`.
- Native project exists at `ios/App/App.xcodeproj`.
- Bundle ID: `com.shootr.app`.
- Deployment target: iOS 15.0.
- Target device family: iPhone and iPad.
- Signing style: Automatic.

## Changes Made

- Removed obsolete `armv7` required-device capability from `ios/App/App/Info.plist`.
- Added `scripts/clean-ios-public.mjs` to remove stale copied web bundles before Capacitor sync.
- Added `scripts/clean-macos-xattrs.mjs` to strip macOS extended attributes from copied app assets.
- Updated iOS sync scripts in `package.json` to clean public assets and extended attributes around Capacitor sync.
- Added `ios:device-check` to `package.json` for repeatable unsigned iPhone hardware builds before signing is available.
- Updated `scripts/run-ios-simulator.mjs` to support Xcode beta through `DEVELOPER_DIR`.
- Updated the simulator run helper to build with Xcode directly, install the app with `simctl`, and launch it without relying on Capacitor's Simulator.app opener.
- Added an Xcode build phase named `Strip Extended Attributes` before signing.
- Set the app target's supported platforms explicitly to `iphoneos iphonesimulator`.
- Removed stale duplicate native config files named `config 2.xml` and `config 3.xml`.

## Build Issue Fixed

The first simulator build failed during code signing:

```text
resource fork, Finder information, or similar detritus not allowed
```

Cause: copied image/app assets contained macOS extended attributes such as Finder metadata.

Fix: extended attributes are now stripped before sync and again inside the Xcode build before code signing.

## Commands That Passed

```bash
DEVELOPER_DIR=/Users/hashimlafond/Downloads/Xcode-beta.app/Contents/Developer xcodebuild -version
DEVELOPER_DIR=/Users/hashimlafond/Downloads/Xcode-beta.app/Contents/Developer xcrun simctl list runtimes
DEVELOPER_DIR=/Users/hashimlafond/Downloads/Xcode-beta.app/Contents/Developer xcodebuild -list -project ios/App/App.xcodeproj
DEVELOPER_DIR=/Users/hashimlafond/Downloads/Xcode-beta.app/Contents/Developer node scripts/run-ios-simulator.mjs
DEVELOPER_DIR=/Users/hashimlafond/Downloads/Xcode-beta.app/Contents/Developer pnpm run ios:sync:testflight
DEVELOPER_DIR=/Users/hashimlafond/Downloads/Xcode-beta.app/Contents/Developer pnpm run ios:device-check
```

## Launch Status

Shootr now builds, installs, and launches successfully in the iPhone 17 Pro simulator.

Launch output:

```text
com.shootr.app: 16567
Shootr launched on iPhone 17 Pro.
```

Launch screenshot:

```text
/Users/hashimlafond/Documents/Codex/2026-05-30/can-you-build-apps/outputs/shooters-la/documentation/shootr-ios-simulator-launch.png
```

## Startup Verification

- Capacitor sync completed.
- Web assets are present in the native app bundle.
- Native entrypoint routes to `/app`.
- App reached the Shootr first screen in the simulator.
- WebKit logs show the main frame finished loading and first meaningful paint occurred.
- No startup crash was detected in the simulator log.

Some simulator/system log noise was present from WebKit and Apple frameworks, but no critical Shootr startup error was found.

## How To Run From Terminal

From the project folder:

```bash
cd /Users/hashimlafond/Documents/Codex/2026-05-30/can-you-build-apps/outputs/shooters-la
DEVELOPER_DIR=/Users/hashimlafond/Downloads/Xcode-beta.app/Contents/Developer node scripts/run-ios-simulator.mjs
```

## How To Fix Xcode's Destination Picker

In Xcode beta:

1. Open `ios/App/App.xcodeproj`.
2. In the top toolbar, click the destination picker.
3. Do not choose `Any iOS Device (arm64)`.
4. Choose a real simulator, such as `iPhone 17 Pro`.
5. Press Run.

If no simulators appear, open:

```text
Xcode > Settings > Platforms
```

Install the iOS 27 simulator runtime.

## Physical iPhone Status

Shootr now compiles successfully for a physical iPhone target with signing disabled:

```text
** BUILD SUCCEEDED **
```

The app is ready for a signed physical-device run once owner-controlled signing is completed.

Xcode beta still prints this command-line warning during the unsigned device build:

```text
IDERunDestination: Supported platforms for the buildables in the current scheme is empty.
```

The app target itself now resolves `SUPPORTED_PLATFORMS=iphoneos iphonesimulator`, and the iPhone hardware build succeeds, so this warning is not currently blocking.

Remaining owner actions:

1. Connect an iPhone by USB or enable wireless debugging.
2. Trust the Mac on the iPhone.
3. Sign into Xcode with an Apple Developer account.
4. Select the Apple Developer Team for the `App` target.
5. Select the physical iPhone destination instead of `Any iOS Device (arm64)`.
6. Press Run.

Codex cannot complete Apple account login, signing-team selection, or device trust prompts without the owner's credentials and physical device confirmation.

## Next Recommended Step Toward Internal TestFlight

1. Confirm the simulator launch in Xcode beta using an iPhone simulator destination.
2. Connect and run on a real iPhone after selecting the Apple Developer Team.
3. Create a Release archive in Xcode.
4. Validate the archive.
5. Upload to App Store Connect for internal TestFlight.
