# Native iOS Test Results

Date: 2026-07-31

## Commands Run

| Command | Result | Evidence |
|---|---|---|
| `pnpm install --no-frozen-lockfile` | Passed | Capacitor 8 packages installed and lockfile updated. |
| `pnpm run build` | Passed with warning | Vite built `dist/`; warning remains for legacy non-module `app.js` on the landing page. |
| `VITE_SHOOTR_ENV=testflight VITE_SHOOTR_DEMO_MODE=false vite build` | Passed with warning | TestFlight-mode web assets built with demo mode off. |
| `CI=true pnpm run ios:sync:testflight` | Passed with warning | TestFlight-mode web assets built and synced into `ios/App/App/public`. |
| `./node_modules/.bin/cap add ios` | Passed | `ios/` native project generated. |
| `./node_modules/.bin/cap sync ios` | Passed | Web assets copied; 4 Capacitor iOS plugins detected. |
| `plutil -lint ios/App/App/Info.plist ios/App/App/PrivacyInfo.xcprivacy` | Passed | Both plist files are valid. |
| `node` JSON parse for root/native Capacitor configs | Passed | Root and copied Capacitor JSON parsed successfully. |
| `node --check platform.js` | Passed | No syntax errors. |
| `node tests/platform.test.js` | Passed | 10 platform tests passed. |
| `./node_modules/.bin/cap doctor ios` | Passed | Capacitor Doctor reported iOS looking great. |
| `pnpm audit --audit-level moderate` | Passed | No known vulnerabilities found. |
| secret/signing asset scan | Passed | No `.p8`, `.p12`, `.mobileprovision`, `.cer`, `.certSigningRequest`, `.xcarchive`, or `.ipa` files found. |
| `xcodebuild -version` | Failed environment check | Full Xcode is not selected; active developer directory is Command Line Tools. |
| `xcodebuild -list -project ios/App/App.xcodeproj` | Failed environment check | Same full-Xcode blocker. |

## Simulator And Device Matrix

| Test | Device | iOS Version | Build | Result | Evidence | Unresolved Issue |
|---|---|---|---|---|---|---|
| Fresh install | iPhone simulator | unavailable | Debug | Skipped | `xcodebuild` unavailable | Full Xcode required. |
| First launch | iPhone simulator | unavailable | Debug | Skipped | `xcodebuild` unavailable | Full Xcode required. |
| Login/logout/session restoration | iPhone simulator | unavailable | Debug | Skipped | native launch unavailable | Also requires production auth before release. |
| Booking Now | iPhone simulator | unavailable | Debug | Skipped | native launch unavailable | Web route exists; native runtime unverified. |
| Booking Later | iPhone simulator | unavailable | Debug | Skipped | native launch unavailable | Web route exists; native runtime unverified. |
| Location denial | iPhone simulator | unavailable | Debug | Skipped | native launch unavailable | Must test after full Xcode install. |
| Camera denial | iPhone simulator | unavailable | Debug | Skipped | native launch unavailable | Must test after full Xcode install. |
| Photo-library denial | iPhone simulator | unavailable | Debug | Skipped | native launch unavailable | Must test after full Xcode install. |
| Notification denial | iPhone simulator | unavailable | Debug | Skipped | push disabled | Do not test until push is intentionally implemented. |
| Support report | iPhone simulator | unavailable | Debug | Skipped | native launch unavailable | Web prototype has local report form only. |
| Block user | iPhone simulator | unavailable | Debug | Skipped | native launch unavailable | Web prototype has local block request only. |
| Delete account | iPhone simulator | unavailable | Debug | Skipped | native launch unavailable | Web route exists; backend deletion incomplete. |
| Background/terminate/resume | iPhone simulator | unavailable | Debug | Skipped | native launch unavailable | Full Xcode required. |
| Offline launch/slow network | iPhone simulator | unavailable | Debug | Skipped | native launch unavailable | Full Xcode required. |
| External legal links | iPhone simulator | unavailable | Debug | Skipped | native launch unavailable | Full Xcode required. |
| Failed API request | iPhone simulator | unavailable | Debug | Skipped | no production API | Needs backend environment. |
| Demo mode disabled | Release | unavailable | Release/TestFlight web payload | Passed for bundled assets | `ios/App/App/public/assets/platform-*.js` contains `VITE_SHOOTR_ENV:testflight` and `VITE_SHOOTR_DEMO_MODE:false` | Must still pair with a real backend/reviewer environment before TestFlight upload. |

## Summary

The native iOS foundation was generated and non-Xcode validation passed. A real Debug build, simulator launch, archive, and TestFlight upload could not be completed on this machine until full Xcode is installed and selected.
