# Shootr V1 Architecture Audit

## Short Internal Audit

- Home: simple and action-first. Now/Later intent previously used mixed casing and could lead to a duplicate timing decision after Location.
- Booking flow: generally coherent, but timing intent needed normalization and preservation across steps.
- Location flow: has manual fallback and approximate-location copy. It needed to skip Now/Later when timing was already chosen.
- Shootr matching: uses approved Shootrs and scoring. Trust signals existed informally; structured trust/metrics were missing.
- Live tracker: no longer shows a fake live route before assignment. Customer labels avoid raw state names.
- Bookings: has empty states and booking CTA. Raw booking states are mostly hidden behind customer labels.
- Moments: private by default, but needed a reusable rights model. Demo gallery needed gating when demo mode is off.
- Profile: one-account shape is in place. Customer and Shootr profile states live together; admin remains separate.
- Become a Shootr: V1 photo-only; onboarding has identity, area, setup, portfolio, safety, and payout scaffolding.
- Approved Shootr job flow: exists as guarded app routes. Needs backend approval and real job feeds before launch.
- Payments: has authorization/capture/refund service split. Pricing needed a more configurable breakdown.
- Payouts: placeholder only. Needs real Connect or payout provider before launch.
- Safety/Support: report, block, support, emergency contact, and policy copy exist. Backend moderation is still required.
- Permissions: location is contextual; camera/photo-library/native notifications require iOS implementation later.
- Admin separation: admin routes are protected and not linked in consumer navigation.
- Demo mode: now gates initial fixtures and visible demo galleries/profiles more consistently.
- App Store readiness: policy surfaces and deletion entry exist; native wrapper, privacy manifest, App Store privacy labels, and backend deletion are still required.

## Implemented In This Pass

- Normalized `/app/book?timing=now` and `/app/book?timing=later`.
- Location advances directly to “Choose your Shootr” when timing was already selected.
- Added structured trust status and Shootr metrics model defaults.
- Added rights/consent model defaults with portfolio, social, and platform marketing permissions off.
- Added hidden editing request model for future editing add-ons.
- Added configurable pricing fields for service fee, processing fee, tax, discount, commission, payout, and refunds.
- Added feature flags requested for future monetization and platform controls.
- Filtered demo Shootrs out of visible matching/public surfaces when demo mode is disabled.
- Prevented demo Moments gallery creation when demo mode is disabled.
- Added support case storage alongside safety incident records.

## Still Required Before V1 Launch

- Real authentication and account linking.
- Backend database schema, RLS, and storage policies.
- Production account deletion, data export, token revocation, and media retention.
- Real payment provider, refund handling, payout provider, and tax treatment.
- Real Shootr approval workflow and admin review queue.
- Real report/block moderation workflows and escalation SLAs.
- iOS wrapper with Info.plist permission strings and PrivacyInfo.xcprivacy.
- App Store privacy labels based on final SDKs and data flows.
- Remove or disable demo mode for production.

