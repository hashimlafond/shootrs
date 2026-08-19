# App Review Notes Draft

This file is a draft for App Store Connect review notes. Do not include real credentials in the public repository.

## Review Environment

Shootr is not ready for App Store review until a protected review environment exists.

Required environment:
- Customer reviewer account: provide through secure App Store Connect notes.
- Approved Shootr reviewer account: provide through secure App Store Connect notes.
- Sandbox payments only.
- Predetermined safe service area.
- Controlled test booking.
- Safe sample private gallery.
- Deterministic booking progression.
- No real dispatch.
- No real payout.
- No real identity documents.

## Suggested Reviewer Flow

1. Sign in with the supplied customer reviewer account.
2. Open Shootr.
3. Start a booking.
4. Use current location or enter a manual location.
5. Choose Now or Later.
6. Choose Phone, Pro Camera, or No Preference.
7. Choose a session length.
8. Select a review Shootr.
9. Confirm adult/minor and rights acknowledgements.
10. Authorize sandbox payment.
11. Confirm booking.
12. Open Booking Details and Tracker.
13. Open Moments after the controlled booking reaches delivered state.
14. Report a delivered image from Moments.
15. Open Support and submit a test support report.
16. Open Profile > Delete Account and verify the deletion initiation flow.

## Current Review Limitation

The current repo is still a web prototype with a Capacitor config, not a complete native iOS project. Do not submit this build until native iOS files, signing, privacy manifest, permission strings, and backend review services are complete.

