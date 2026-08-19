# Shootr MVP

Shootr connects people with someone nearby who can capture their moment using a capable phone or professional camera.

The build has two surfaces:

- A short public landing page at `/`
- A mobile-first app shell for people booking photos, Shootrs, and internal operators

The public page stays minimal. Booking happens inside `/app`.

## Project Structure

- `index.html`: public landing page
- `app.js`: landing-page pricing, menu, PWA install guidance, and service-worker registration
- `platform.html`: shared app route shell
- `platform.js`: route renderer for app, Shootr, public utility, and internal screens
- `styles.css`: shared responsive design and mobile app styles
- `manifest.webmanifest`: PWA manifest
- `service-worker.js`: offline shell and cache
- `capacitor.config.json`: iOS-ready Capacitor placeholder config
- `data/fixtures.js`: mock packages, service areas, Shootrs, and bookings
- `config/settings.js`: pricing-related config, feature flags, storage periods, adapters
- `types/models.js`: roles, statuses, availability states, and schema list
- `services/`: replaceable mock services for booking, pricing, matching, maps, payments, galleries, uploads, notifications, analytics, storage, camera, reviews, and adapters
- `utils/route-guards.js`: role-aware route protection
- `tests/platform.test.js`: highest-risk service tests

## Landing Routes

- `/`
- `/how-it-works`
- `/pricing`
- `/safety`
- `/terms`
- `/privacy`
- `/become-a-shootr`

## App Routes

- `/app`
- `/app/request`
- `/app/matches`
- `/app/bookings`
- `/app/bookings/demo-booking`
- `/app/vault`
- `/app/vault/demo-booking`
- `/app/profile`
- `/app/support`

App bottom nav:

- Home
- Bookings
- Vault
- Profile

## Shootr App Routes

- `/shootr`
- `/shootr/onboarding`
- `/shootr/requests`
- `/shootr/jobs`
- `/shootr/jobs/demo-booking`
- `/shootr/jobs/demo-booking/deliver`
- `/shootr/availability`
- `/shootr/vault`
- `/shootr/earnings`
- `/shootr/profile`
- `/shootr/settings`
- `/shootr/support`

Shootr bottom nav:

- Requests
- Jobs
- Available
- Earnings
- Profile

## Admin Routes

- `/admin`
- `/admin/users`
- `/admin/shootrs`
- `/admin/businesses`
- `/admin/agencies`
- `/admin/bookings`
- `/admin/galleries`
- `/admin/incidents`
- `/admin/payments`
- `/admin/service-areas`
- `/admin/settings`

The admin shell is designed so an early pilot can be operated manually without editing source code.

## Roles

Supported roles:

- `subject`
- `shootr`
- `business`
- `agency`
- `admin`

Users may eventually hold more than one role, but each role keeps a distinct interface.

## Mock Versus Production Services

This MVP uses local storage and mock service adapters. Production integrations should replace:

- Authentication: `utils/route-guards.js`
- Database: `services/storage-service.js`
- Object storage: `services/gallery-service.js` and `services/upload-service.js`
- Image processing: future adapter behind gallery/upload services
- Maps/geocoding/ETA: `services/map-service.js` and `services/matching-service.js`
- Geolocation: browser geolocation in `platform.js`
- Payments and payouts: `services/payment-service.js`
- SMS, email, push: `services/notification-service.js`
- Analytics: `services/analytics-service.js`
- Identity verification: onboarding/admin review flow

No production secrets belong in browser code.

## Environment Variables

Static MVP requires no environment variables.

Future public variables:

- `NEXT_PUBLIC_APP_STORE_URL`: optional App Store link. If absent, the landing page shows Add to Home Screen guidance instead of a fake badge.
- `SHOOTR_BACKEND_URL`
- `SHOOTR_PUBLIC_AUTH_KEY`
- `SHOOTR_PAYMENT_PUBLIC_KEY`
- `SHOOTR_MAPS_PUBLIC_KEY`
- `SHOOTR_SMS_PUBLIC_KEY`

Future secret variables must live only on the server.

## Local Development

From this folder:

```bash
python3 -m http.server 4176
```

Open:

```text
http://localhost:4176/
```

Use the demo role chooser when protected app routes ask for access.

## PWA Setup

The PWA includes:

- `manifest.webmanifest`
- standalone display mode
- app start URL at `/app/`
- app icons
- Apple touch icon links
- theme/background colors
- safe-area CSS
- service worker
- offline shell
- local draft persistence
- device-appropriate Add to Home Screen guidance

Push notifications are not requested on first visit. They should be requested only after meaningful user action.

## iOS Capacitor Prep

`capacitor.config.json` uses the placeholder bundle identifier:

```text
com.shootr.app
```

Replace it before release.

Future iOS setup:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init Shootr com.shootr.app
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

App Store publishing requires:

- Apple Developer account
- production bundle identifier
- signing certificates
- provisioning profiles
- privacy disclosures
- App Store screenshots
- support URL
- privacy-policy URL
- completed review submission

This build is not published to the App Store.

## Storage Integration

The Vault is private by default. Production storage should use:

- signed upload URLs
- direct-to-storage uploads
- resumable uploads
- batch upload
- progress, pause, retry
- duplicate detection
- interrupted-upload recovery
- thumbnail, preview, original variants
- signed expiring download URLs

Default full-resolution availability is configurable and currently set to 90 days.

## Maps Integration

Production maps should support:

- geocoding
- address search
- choose-on-map fallback
- ETA calculation
- distance filtering
- service-area checks
- approximate pre-acceptance location
- exact address release only after confirmation

## Payments Integration

The payment interface prepares for:

- authorization
- capture
- service fee
- Shootr commission
- urgency fee
- travel fee
- venue fee
- taxes
- tips
- cancellation fees
- partial and full refunds
- disputes
- promotional credits
- Shootr payouts

Do not capture payment unless the booking rules allow it.

## Notification Integration

Notification events are adapter-independent and prepared for in-app, SMS, email, and push:

- verification code
- request received
- request accepted
- payment authorized
- booking confirmed
- Shootr en route
- Shootr arrived
- booking cancelled
- replacement found
- photos ready
- gallery expiring
- review reminder
- tip received
- payout update
- incident update

## Security Assumptions

- Exact private-home addresses are hidden before confirmation.
- Portfolio use defaults off.
- Social use defaults off.
- Platform marketing use defaults off.
- Gallery links are signed, expiring, and revocable.
- Minors cannot independently book or become Shootrs in version 1.
- Camera, location, and notification permissions are requested only after user action.

## Known Limitations

- Data is stored in browser local storage.
- Payments are mock interfaces.
- Matching uses mock availability and demo profiles.
- Uploads use mock signed URLs.
- Admin actions are interface placeholders, not backend workflows.
- Legal copy requires review.

## Tests

Run:

```bash
node tests/platform.test.js
```

Covered behavior:

- role-protected routes
- booking creation
- exact-address privacy
- temporary booking lock
- duplicate acceptance prevention
- payment authorization before confirmation
- cancellation, expiry, and rematching
- price calculations
- payment states
- gallery authorization
- signed-link expiration
- portfolio permission defaults
- upload retry
- review eligibility

Mobile layouts should be checked at:

- 320px
- 375px
- 390px
- 430px
- 768px
- 1440px

The 390px iPhone layout is primary.

## Legal Review Needed

- Terms of Service
- Privacy Policy
- Cancellation Policy
- Community Standards
- Photo Consent
- Copyright and Content Policy
- Safety Policy
- Minor/guardian policy
- Shootr service agreement
