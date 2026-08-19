# Shootr App Store Launch Audit

Date: 2026-07-31

Scope: Existing Shootr web app and generated Capacitor iOS project in this repository. Native iOS files now exist, but full Xcode is not selected on this machine, so native build integrity, signing, simulator launch, archive validation, physical-device permission prompts, and TestFlight behavior cannot be fully verified from this workspace.

Apple references used:
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Account deletion guidance: https://developer.apple.com/support/offering-account-deletion-in-your-app
- Privacy manifest files: https://developer.apple.com/documentation/bundleresources/privacy-manifest-files
- Required reason APIs: https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api
- App privacy details: https://developer.apple.com/app-store/app-privacy-details/

## Findings

| Severity | Affected Route/Area | Impact | App Review Risk | Repro Steps | Recommended Fix | Status |
|---|---|---|---|---|---|---|
| blocker | Native iOS build | `ios/` project now exists with permission strings and privacy manifest, but Xcode build/simulator launch is unverified because full Xcode is unavailable. | Cannot upload a verified TestFlight build until Xcode signing/build/archive pass. | Run `xcodebuild`; active developer directory is Command Line Tools. | Install/select full Xcode, configure signing, build Debug, launch simulator, then archive Release. | partial |
| blocker | Production truth | `DEMO_MODE` is true and adapters are mock/localStorage. | Fake bookings, profiles, earnings, tracking, and payments are not production truthful. | Inspect `config/settings.js`. | For review/prod, set demo false and provide protected deterministic review backend. | blocked |
| blocker | Payments | Payments are mocked; no server-side authorization/capture/webhooks/idempotency. | Booking flow cannot prove real-world service payment handling or sandbox review behavior. | Inspect `services/payment-service.js`. | Integrate sandbox payment provider and webhook validation before external review. | blocked |
| blocker | Authentication/session | Sign-in is local prototype only; no token lifecycle, passwordless provider, Apple token revocation, or backend session. | Login and account deletion may fail Guideline 4.8/5.1.1 expectations if real accounts are offered. | Open `/sign-in` or `/app`; tap auth provider. | Implement real auth or hide account-required claims. Add Sign in with Apple if any third-party login ships. | blocked |
| high | `/app/profile/delete-account` | In-app deletion flow exists and was verified, but it only clears local prototype state. | Apple requires account deletion initiation in app for apps with account creation; server-side deletion must work. | Open Profile > Delete Account, type `DELETE`. | Connect to backend deletion job, revoke sessions/tokens/share links, and track retained legal records. | partial |
| high | UGC safety | Report/block controls now exist in support and Moments, but moderation is local only. | UGC apps must filter objectionable content, report content, block abusive users, and publish contact info. | Open `/app/support?topic=gallery` and `/app/moments/demo-booking`. | Route reports/blocks to support/moderation system with SLA and enforcement workflow. | partial |
| high | Deep links/static routing | Arbitrary booking deep links such as `/app/bookings/not-real/track` 404 in static web serving. | Reviewers may hit dead links or app links may fail. | Direct-load `/app/bookings/not-real/track`. | Native wrapper should route all app paths to SPA entry or generate fallback worker rules. | blocked for native |
| high | Permissions | Info.plist now contains location, camera, photo-library read, and photo-library add strings. Device prompt timing remains unverified. | Inaccurate or non-contextual prompts can cause rejection. | Inspect `ios/App/App/Info.plist`. | Test permission prompts and denial fallbacks in simulator and on physical iPhone. | partial |
| high | Minor safety | Shootr onboarding enforces age 18; booking confirmation now requires adult/minor acknowledgement. | Marketplace involving sessions with minors needs clear adult/guardian controls. | Open `/app/profile/become-a-shootr?step=1` and `/app/book?step=9`. | Backend must enforce adult accounts and retain consent audit records. | partial |
| medium | Booking confirmation | The review screen now prevents confirmation without a selected Shootr and age/rights acknowledgement. | Reduces broken flow and consent ambiguity. | Open `/app/book?step=9`; confirm button is disabled until a Shootr is selected. | Connect to real match/payment state. | resolved in prototype |
| medium | Gallery/reporting | Delivered images have report links and block user action. | Improves UGC safety surface. | Open `/app/moments/demo-booking`. | Add per-asset moderation IDs and takedown workflow. | partial |
| medium | Cancellation/refunds | Cancellation states exist, but policies are not configurable end-to-end. | Hidden or unclear fees/refunds can trigger review or customer trust issues. | Inspect booking confirmation and payment services. | Add policy engine and show terms before payment. | partial |
| medium | Accessibility | Focus-visible and reduced-motion styles exist; mobile route checks passed basic presence. | Needs VoiceOver and physical-device Dynamic Type validation. | Inspect CSS and mobile viewport checks. | Test on iPhone with VoiceOver, text size, reduce motion, denied permissions. | requires physical-device testing |
| low | Public legal pages | Terms/privacy/community/account deletion pages are drafts. | Legal/policy content may be insufficient for real launch. | Open `/terms`, `/privacy`, `/community-standards`, `/account-deletion`. | Attorney review required before launch. | requires legal review |

## Verified Mobile Routes

Checked at 390 x 844 local browser viewport:
- `/app/book?step=9`: selected-Shootr guard, adult acknowledgement, rights acknowledgement present.
- `/app/profile/delete-account`: route loads, deliberate `DELETE` confirmation present.
- `/app/support?topic=gallery`: content/user reporting, block request, urgent safety flag present.
- `/app/moments/demo-booking`: report photo and block user controls present.
- `/app/bookings/not-real/track`: still 404 in static server; documented as deep-link blocker.

## Native iOS Foundation Results

- Capacitor 8 iOS project generated at `ios/`.
- Production web assets synced to `ios/App/App/public`.
- Installed native plugins: App, Browser, Keyboard, Status Bar.
- No native push, Apple Pay, background location, associated domains, Sign in with Apple, Camera, Geolocation, Maps, Stripe, analytics, or crash SDK installed.
- `PrivacyInfo.xcprivacy` created and added to app target resources.
- `cap doctor ios`: passed.
- `xcodebuild`: blocked by missing full Xcode selection.

## Baseline Test Results

- `node --check outputs/shooters-la/platform.js`: passed.
- `node outputs/shooters-la/tests/platform.test.js`: passed, 10 tests.
