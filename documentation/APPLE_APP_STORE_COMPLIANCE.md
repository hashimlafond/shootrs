# Shootr Apple App Store Compliance Notes

This document tracks App Store readiness for the current Shootr prototype. It is not legal advice.

## Current Architecture

Shootr is currently a static web/PWA prototype. No native iOS wrapper, Xcode project, Info.plist, entitlements, or PrivacyInfo.xcprivacy file exists in this source tree.

## Implemented In Prototype

- Account deletion is reachable from Profile > Legal.
- Privacy Policy, Terms, Community Standards, and Account Deletion Policy pages are reachable.
- Location is requested only after the user chooses Use Current Location, with manual address fallback.
- Demo profiles and demo galleries are labeled.
- Matches no longer display fake ratings.
- Tracker does not show a live route before a Shootr is assigned.
- Support includes report, block, privacy, location, payment, and safety categories.
- Gallery detail links to Report an Issue.
- Payment copy states bookings are real-world services performed outside the app.
- Auth copy notes Sign in with Apple must be present if other social login is enabled.

## Must Be Completed Before App Store Submission

- Build the actual iOS target or wrapper.
- Add accurate Info.plist usage descriptions for every requested permission.
- Add PrivacyInfo.xcprivacy to the iOS app bundle.
- Generate and review the Xcode privacy report.
- Complete App Store Connect privacy labels from the real implementation.
- Implement production account deletion against backend data, storage, auth providers, and payment records.
- If Sign in with Apple is used, revoke Apple tokens during account deletion where required.
- Implement server-side moderation queues for reports, blocks, gallery complaints, impersonation, copyright, and safety incidents.
- Implement tested customer support contact handling.
- Implement backend access controls for private galleries and media.
- Confirm all payments are only for real-world services unless Apple in-app purchase is used for digital goods.
- Remove or gate all development/demo data from production builds.
- Provide Apple reviewer credentials and reviewer notes.

## Native Permission Checklist

- Location When In Use: only after the user requests nearby Shootrs.
- Precise Location: avoid unless required; approximate location should work.
- Camera: only when capturing or uploading media inside app.
- Photo Library Read: only when selecting media.
- Photo Library Add: only when saving delivered Moments.
- Notifications: only after explaining booking update value.
- Tracking: do not request unless cross-app/site tracking exists and ATT disclosures are complete.
- Microphone, Contacts, Bluetooth, Local Network, Face ID, Calendars, Motion, Always Location, Background Modes: do not declare unless a shipped feature needs them.

## App Privacy Label Draft

Likely collected for app functionality:

- Contact info: name, email, phone.
- Location: approximate location, and exact location after booking confirmation when needed.
- User content: profile photos, portfolio media, private gallery media, notes, reviews, support reports.
- Identifiers: account ID, notification token if push is implemented.
- Purchases: booking/payment status and transaction records via payment provider.
- Diagnostics: only if crash reporting is added.

Do not mark tracking unless Shootr shares data for cross-app/site tracking or advertising attribution.

