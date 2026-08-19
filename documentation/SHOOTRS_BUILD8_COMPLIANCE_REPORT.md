# Shootrs Build 8 Compliance Report

## Apple Rejection Addressed

Guideline 1.2 Safety: User-Generated Content.

## UGC Surfaces Identified

Profile photos, Shootr portfolios, delivered Moments, booking notes, bios/profile text, reviews/ratings placeholders, messages/support text, reference uploads, public/private galleries, and user report comments.

## Terms/EULA Implementation

Terms/EULA gate added before auth/login and Shootr onboarding. Users must actively agree to version `shootrs-eula-v1.2-build8`. Acceptance timestamp and Terms version are stored.

## Report Mechanism

Visible report entry points were added to support, Moments, match cards, and public profiles. Reports store reporter, reported user, content ID, category, timestamp, app version, build number, and status.

## Block Mechanism

Block controls create persistent local block records and moderation events. Blocked users are immediately filtered from visible discovery/profile/gallery surfaces.

## Filtering Method

V1 includes a simple text filter for prohibited phrases, blocked-user filtering, suspended-user filtering, and removed-content filtering. Automated image moderation is not claimed.

## Moderation Operations

`/admin/incidents` now shows a moderation queue with new reports, overdue count, active blocks, report age, and actions to remove content, suspend user, dismiss report, or restore content.

## 24-Hour Workflow

Reports are timestamped and receive a 24-hour due time. Admins can identify overdue reports.

## Physical Device QA

Not complete in Codex. Owner must test on a physical iPhone and record the required demonstration.

## Automated Verification

- JavaScript syntax check passed for `platform.js`.
- JavaScript syntax check passed for `services/storage-service.js`.
- TestFlight web build passed with `pnpm run build:testflight`.
- Fresh `dist` output was copied into `ios/App/App/public`.
- Unsigned iPhone release build passed with Xcode beta using `CODE_SIGNING_ALLOWED=NO`.
- `pnpm test` is unavailable because the package does not currently define a test script.
- `cap sync ios` stalled in this workspace, so generated iOS web assets were refreshed manually from the successful build output.

## Screen Recording Filename

`Shootrs_Guideline_1_2_Compliance_Build8.mov`

## Build Number

Version: 1.0  
Build: 8  
Bundle ID: `com.shootr.app`

## Archive Validation / Upload Result

Not performed by Codex in this pass. Owner must archive, validate, upload Build 8, and attach the physical-device recording notes in App Store Connect.

## Safe To Select For App Review?

Not yet. Build 8 should not be selected until physical-device QA passes, the screen recording is captured, and archive validation/upload succeeds.
