# Shootr Production Conversion Baseline

Generated: 2026-07-24

This baseline is Phase 0 only. It documents the current Shootr repository before production implementation. It does not redesign the product and does not replace the current mobile-first experience.

## Current Architecture

Shootr is currently a static/Vite multi-page web application with a mobile-first app shell rendered primarily through ES modules.

- Framework/build: Vite MPA configuration in `vite.config.js`.
- Runtime language: browser HTML, CSS, and JavaScript ES modules.
- Main app renderer: `platform.js`.
- Landing/marketing renderer: `app.js`.
- Styling: `styles.css`.
- Data fixtures: `data/fixtures.js`.
- Service layer: small frontend service modules in `services/`.
- Types/constants: `types/models.js`.
- Route guards: `utils/route-guards.js`.
- PWA: `manifest.webmanifest` and `service-worker.js`.
- Native wrapper status: `capacitor.config.json` exists, but no `ios/` directory, Xcode project, `Info.plist`, entitlements, Podfile, or `PrivacyInfo.xcprivacy` was found.
- Existing audit package: `audit-package/` exists at the workspace root and documents the app as a prototype with mock/local services.

React, React DOM, TypeScript, Vite, and `@vitejs/plugin-legacy` are declared as dependencies, but the current source is mostly vanilla JavaScript and static HTML. No lockfile is present.

## Routing System

Routes are represented by static directories and Vite MPA inputs. Key route groups:

- Public: `/`, `/how-it-works`, `/pricing`, `/safety`, `/help`, `/become-a-shootr`, `/shootrs`, `/shootrs/hashimlafond`, `/waitlist`, `/terms`, `/privacy`, `/sign-in`, `/sign-up`, `/forgot-password`, `/verify`.
- Customer app: `/app`, `/app/book`, `/app/search`, `/app/request`, `/app/matches`, `/app/bookings`, `/app/bookings/demo-booking`, `/app/bookings/demo-booking/track`, `/app/moments`, `/app/moments/demo-booking`, `/app/vault`, `/app/gallery/demo-booking`, `/app/profile`, `/app/support`.
- Unified profile extensions: `/app/profile/become-a-shootr`, `/app/profile/shootr-status`, `/app/profile/shootr-settings`, `/app/profile/portfolio`, `/app/profile/availability`, `/app/profile/earnings`, `/app/profile/payouts`.
- Shootr/legacy creator routes: `/shootr/*`.
- Admin/internal routes: `/admin/*`.

Several routes are prototype/demo routes, especially paths containing `demo-booking`. Admin routes are present in the public source tree and are protected only by client-side role checks.

## State Management

State is browser-local.

- `services/storage-service.js` uses `localStorage` key `shootr-platform-store-v1`.
- Session capability checks use `localStorage` key `shootr-active-role`.
- Demo records seed the store from `data/fixtures.js`.
- No backend persistence, database connection, server session, or server authorization layer exists.

## Styling System

The current mobile-first visual system is centralized in `styles.css`. It includes the current Shootr product language, bottom navigation, Focus Mark, Liquid Glass-style controls, and responsive app surfaces. This baseline does not modify the design.

## PWA Configuration

PWA files exist:

- `manifest.webmanifest`
- `service-worker.js`
- app icons/assets referenced from `assets/`

The PWA shell exists, but production offline behavior, private media cache safety, interrupted uploads, and iOS standalone behavior are not fully validated.

## Native Wrapper Status

`capacitor.config.json` declares:

- app ID: `com.shootr.app`
- app name: `Shootr`
- web dir: `dist`
- plugin permission copy for Camera, Geolocation, and Push Notifications

No native iOS project exists. There is no verified Apple permission configuration, privacy manifest, associated domains, Sign in with Apple entitlement, Apple Pay entitlement, APNs setup, native camera/photo-library implementation, or Xcode build configuration.

## Current Working Features

These features currently work as frontend prototype logic:

- Mobile-first app navigation and product flow surfaces.
- Now/Later-style booking journey UI.
- Location options in UI, including browser geolocation affordances.
- Phone, Pro Camera, and No Preference preference flow.
- Session duration/package concepts.
- Demo matching and demo Shootr ranking.
- Booking state transition helper functions.
- Mock payment intent/authorization/capture/refund helpers.
- Demo live tracker route.
- Demo/private Moments and gallery surfaces.
- Mock upload batch/retry helpers.
- Profile and become-a-Shootr surfaces.
- Local account/profile deletion affordance.
- Static admin route surfaces.
- Static Terms/Privacy/Safety routes.
- Standalone service tests for current mock logic.

These are product-specification-level flows, not production marketplace systems.

## Mocked Features

The following are mocked, local-only, or hardcoded:

- Authentication: no real provider; local/session role only.
- Account capabilities: client-side roles only.
- Database: localStorage only.
- Object storage: mock signed URLs.
- Image processing: mock thumbnail/metadata model only.
- Maps/geocoding/ETA: mock or browser-only.
- Matching: fixture-based scoring, not real eligibility.
- Atomic booking acceptance: frontend object lock only.
- Payments: mock provider only.
- Payouts/earnings: mock UI/data only.
- SMS/email/push: mock/in-app event objects only.
- Notifications: no provider, APNs, SMS, or email backend.
- Identity verification: manual-review label only.
- Shootr approval: demo status only.
- Portfolio review: demo/profile data only.
- Live tracking: demo route/local state only.
- Moments galleries: local/demo privacy, no server storage enforcement.
- Share links: client-generated mock tokens.
- Reviews/reputation: demo thresholds/helpers, no production review lifecycle.
- Referrals: local/profile links only.
- Admin portal: static/prototype screens only.
- Account deletion: local browser cleanup only.
- Legal/policy system: placeholder or draft routes.

## Hardcoded And Demo Records

Known demo/development records and behavior:

- `data/fixtures.js` contains `demoShootrs`, including `Demo Go Shootr`.
- `data/fixtures.js` contains `demoBooking` with ID `demo-booking`.
- Routes contain `demo-booking` paths for bookings, tracker, jobs, gallery, Moments, and vault.
- Static public profile route `/shootrs/hashimlafond` exists as a demo/profile route.
- Settings currently use `demoMode: true`.
- Settings currently use `marketplaceMode: availability_alerts`.
- Feature flags and adapters are hardcoded in `config/settings.js`.
- Prices are defined in `data/fixtures.js` and `services/pricing-service.js`.
- Several reputation labels exist in configuration but are not backed by production data.

Production must isolate all demo records behind explicit `DEMO_MODE=true` and refuse accidental demo mode in production.

## Existing Integrations

No production backend, payment, auth, map, notification, storage, analytics, crash reporting, identity verification, or native iOS integration was confirmed.

Existing integration-like files are placeholders or frontend abstractions:

- `capacitor.config.json`: native wrapper config only; no native project.
- `.openai/hosting.json`: ChatGPT Sites hosting metadata.
- `worker/index.js`: Cloudflare/edge-style placeholder file, not a complete backend.
- `services/*`: adapter-shaped frontend modules, currently mock/local.

## Missing Integrations

Required for production:

- Supabase or equivalent database and server API.
- Real auth with Apple, phone, and optional Google support.
- Server-side account capability model.
- Row-level security / backend authorization.
- Secure admin auth.
- Stripe/Stripe Connect and Apple Pay where supported.
- Webhook verification and idempotency.
- Private object storage and signed uploads.
- Image processing pipeline.
- Maps/geocoding/ETA provider behind an adapter.
- Live location service with retention controls.
- Booking-scoped messaging backend.
- Push, SMS, and email notification providers.
- Identity verification integration point.
- Payout onboarding and payout status.
- Incident/support/moderation backend.
- Account deletion workflow and audit trail.
- Privacy manifest and iOS native shell.

## Visually Functional But Not Connected

These screens or flows appear functional but are not connected to production systems:

- Sign in, sign up, verification, and recovery.
- Booking confirmation and payment steps.
- Nearby Shootr matching.
- Live booking tracker.
- Moments/gallery delivery.
- Upload/delivery screens.
- Shootr onboarding/application status.
- Ready/Away and job acceptance flows.
- Earnings and payouts.
- Admin review, payments, incidents, users, galleries, settings, cities, and feature flags.
- Account deletion.
- Referral sharing.
- Safety/support escalation.

## Duplicate Or Obsolete Routes

There are two creator route families:

- Unified app/profile/job routes under `/app/*`.
- Legacy creator routes under `/shootr/*`.

The product direction says one app and one account, so `/app/*` should become the canonical app surface. Legacy `/shootr/*` routes should either redirect cleanly or be removed once production equivalents exist.

Admin routes exist as static public route files and must become a separate protected internal portal before production.

## Broken Or Risky Features

- `git status` stalled during inspection, likely due local/cloud placeholder file behavior observed previously around visual assets.
- Several image assets appear to be local placeholder/sparse files in this workspace; the previous audit ZIP replaced some asset copies with exclusion notes.
- There is no lockfile, so dependency versions are not deterministic.
- There are no lint/typecheck npm scripts.
- Build could not be run in this environment because `npm` is unavailable.
- Production cannot rely on localStorage route guards.
- Production cannot rely on frontend-only booking locks.
- Production cannot ship demo/fake marketplace activity as real.
- Production cannot claim private galleries without backend access controls.

## Security Concerns

Critical issues before real users:

- Client-side authorization only.
- No backend data ownership checks.
- No RLS/storage policies.
- No server-side booking acceptance transaction.
- No server-side payment verification.
- No webhook signature verification.
- No account deletion audit trail.
- No private media access enforcement.
- No secure admin authentication.
- No rate limiting.
- No abuse prevention for login, booking, messaging, uploads, reviews, reports, or share links.
- No production secret-management pattern.

## Privacy Concerns

Critical issues before App Store or production:

- No real privacy manifest.
- No verified Info.plist usage descriptions.
- No production data retention implementation.
- No export/delete backend.
- No precise location retention policy.
- No private gallery storage enforcement.
- No notification-token lifecycle.
- No moderation/UGC policy enforcement.
- No Apple token revocation during deletion.
- No App Store privacy-label implementation tied to actual SDKs.

## Apple Submission Blockers

Shootr is not ready for TestFlight/App Store submission.

Blockers:

- No native iOS project.
- No Xcode build.
- No `PrivacyInfo.xcprivacy`.
- No native permission validation.
- No Sign in with Apple implementation.
- No working account deletion backend.
- No real auth.
- No real payments or sandbox flow.
- No report/block/moderation system.
- No working private media storage.
- No reviewer test accounts.
- No App Store metadata, screenshots, support URL, or finalized privacy URL.
- App currently risks being considered a thin web wrapper unless native/app-like functionality is added.

## Baseline Check Results

Raw logs are stored in `documentation/baseline-checks/`.

| Check | Result | Notes |
|---|---|---|
| Node version | Passed | Bundled Node runtime available. |
| `node --check app.js` | Passed | Syntax check passed. |
| `node --check platform.js` | Passed | Syntax check passed. |
| `node --check service-worker.js` | Passed | Syntax check passed. |
| `node tests/platform.test.js` | Passed | Current mock service tests passed. |
| `npm run build` | Unavailable | `npm` not available in this environment. |
| `npm run lint` | Unavailable | `npm` unavailable and no lint script declared. |
| `npm run typecheck` | Unavailable | `npm` unavailable and no typecheck script declared. |
| `npm test` | Unavailable | `npm` unavailable and no `test` script declared. |
| `npm audit --omit=dev` | Unavailable | `npm` unavailable and no lockfile present. |

## Recommended Implementation Order

Do not start payments, maps, iOS, or Moments storage before the foundation is real.

### Sprint 1 Foundation

1. Add production environment configuration with explicit `APP_ENV` and `DEMO_MODE`.
2. Add sanitized `.env.example`.
3. Add startup/build-time configuration validation.
4. Introduce server/database adapter boundaries without exposing secrets to the browser.
5. Create database migrations for users, profiles, account capabilities, Shootr applications, service areas, booking requests, bookings, audit events, and feature flags.
6. Implement server-side auth identity mapping and account capabilities.
7. Implement RLS/authorization policy tests.
8. Isolate demo data so production cannot show fake marketplace records.

### Sprint 2 Marketplace Operator Foundations

1. Connect Shootr onboarding records.
2. Build protected admin review workflow.
3. Add availability and service-area records.
4. Add portfolio records and private/public asset distinction.
5. Add payout onboarding placeholders and external-account status.

### Sprint 3 Booking Core

1. Replace demo matching with real eligibility.
2. Implement server-enforced booking state machine.
3. Implement atomic acceptance and concurrency tests.
4. Add immutable price quote snapshots.

### Later Sprints

Proceed to payments, live location, messaging, notifications, private Moments storage, reviews, safety, account deletion, iOS, and App Store readiness only after the database/auth/capability foundation exists.

## Phase 0 Conclusion

The current frontend is a strong product specification and prototype. The production conversion should preserve the experience, but nearly every marketplace-critical system behind it must be rebuilt as server-backed infrastructure. The next safe step is Sprint 1: production configuration, database, authentication, account capabilities, row-level authorization, and demo isolation.
