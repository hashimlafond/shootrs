# App Store Release Gate

Date: 2026-07-31

## Readiness Decision

| Gate | Decision | Reason |
|---|---|---|
| Internal TestFlight | Not ready for upload | Native iOS project now exists with Info.plist permission strings and PrivacyInfo.xcprivacy, but full Xcode is not available on this machine, signing is not configured, simulator/device launch is unverified, and the backend review environment is still mocked. |
| External TestFlight | Not ready | Payments, auth, moderation, account deletion, and backend persistence are mocked/local only. |
| App Store Review | Not ready | Multiple blockers remain: native build, privacy manifest, real auth/account lifecycle, sandbox payment backend, production truth mode. |

## Blocked

- Verify native iOS project with full Xcode.
- Configure Apple Developer team, approved bundle identifier, version/build, signing, release configuration.
- Verify exact Info.plist permission descriptions on simulator and physical device.
- Generate and review Xcode privacy report for `PrivacyInfo.xcprivacy`.
- Create protected App Review environment with sandbox payments and deterministic booking states.
- Replace mock auth/localStorage with production-backed auth/session/account lifecycle.
- Implement server-side account deletion, token revocation, and share-link revocation.
- Implement payment authorization/capture/refund/dispute webhooks with idempotency.
- Implement moderation queue for reports, blocks, portfolio images, delivered images, reviews, and messages.
- Ensure dynamic app routes/deep links resolve inside native wrapper.

## Resolved In Prototype

- Native Capacitor iOS project generated under `ios/`.
- Production web assets synced into `ios/App/App/public`.
- App icon asset replaced with the approved Shootr icon source, scaled into the native 1024px slot.
- `Info.plist` contains location, camera, photo-library read, and photo-library add descriptions.
- `PrivacyInfo.xcprivacy` exists and is included in the app target resources.
- Entitlements/capabilities remain minimal; no push, Apple Pay, background location, associated domains, or Sign in with Apple capability is enabled.
- `.gitignore` excludes signing secrets, provisioning profiles, archives, DerivedData, build outputs, and local environment files.
- TestFlight-mode asset build sets `VITE_SHOOTR_ENV=testflight` and `VITE_SHOOTR_DEMO_MODE=false`.

## Native TestFlight Pass Status

- `documentation/NATIVE_IOS_IMPLEMENTATION_PLAN.md` created.
- `documentation/IOS_PERMISSION_COPY.md` created.
- `documentation/IOS_PRIVACY_MANIFEST_AUDIT.md` created.
- `documentation/APPLE_DEVELOPER_OWNER_ACTIONS.md` created.
- `documentation/INTERNAL_TESTFLIGHT_CHECKLIST.md` created.
- `documentation/NATIVE_IOS_TEST_RESULTS.md` created.
- `cap doctor ios` passed.
- `xcodebuild` checks blocked because the active developer directory is Command Line Tools, not full Xcode.

- In-app Profile now links to a dedicated Delete Account flow.
- Delete Account requires deliberate `DELETE` confirmation and explains retained records.
- Booking review prevents confirmation without a selected Shootr.
- Booking review requires adult/minor and private-gallery rights acknowledgements.
- Gallery images include report links.
- Support form captures content type, block request, and urgent safety flag.
- Demo booking fallbacks are guarded by demo mode for booking/tracker lookup.
- Real booking cards link to their own booking IDs.

## Accepted Risk

- Legal pages remain draft copy for product review only.
- Static web prototype uses localStorage for state.
- App still uses demo mode for local testing.

## Requires Legal Review

- Terms of Service.
- Privacy Policy.
- Community Standards.
- Account Deletion Policy.
- Cancellation/refund policy.
- Photo consent and minors policy.
- Shootr payout/contractor terms.

## Requires Accounting/Payments Review

- Platform commission handling.
- Refund liability.
- Chargebacks and disputes.
- Tips.
- Payout timing.
- Tax reporting.

## Requires Physical-Device Testing

- First launch and fresh install.
- Denied/restricted location.
- Manual address fallback.
- Camera/photo-library upload prompts.
- Notification prompt timing and denial fallback.
- Background/resume during active booking.
- Slow/offline network.
- Dynamic Type, VoiceOver, reduced motion, contrast, touch targets.

## Five Most Likely Rejection Causes

1. Missing native iOS project, privacy manifest, or permission strings.
2. Account creation without fully functional server-side account deletion.
3. UGC safety/report/block/moderation not fully operational.
4. Mock payments and fake marketplace/demo data visible in review mode.
5. Web-wrapper risk if the native app does not add meaningful app functionality beyond the website.

## Five Largest Post-Launch Business Risks

1. Trust and safety incidents during in-person sessions.
2. Payment disputes and refund ambiguity.
3. Supply liquidity: not enough nearby Shootrs when moments are urgent.
4. Rights/consent misuse of customer photos, especially minors or private events.
5. Operational burden of manual reviews, moderation, support, and payouts.
