# iOS Privacy Manifest Audit

Date: 2026-07-31

## Manifest Location

- `ios/App/App/PrivacyInfo.xcprivacy`
- Included in app target resources through `ios/App/App.xcodeproj/project.pbxproj`.

## Current Declaration

- Tracking: false.
- Tracking domains: none.
- Collected data types declared for app functionality:
  - Name
  - Email address
  - Phone number
  - Precise location
  - Coarse location
  - Photos or videos
  - Customer support
  - Other user content
- Required-reason accessed API categories: none declared.

## Basis

The manifest mirrors `documentation/PRIVACY_DATA_MAP.md` and current prototype surfaces:

- profile and booking contact details
- optional current location
- support/report forms
- portfolio/gallery/media upload placeholders
- Moments/gallery user content

## Not Declared

- Tracking or cross-app tracking.
- Advertising data collection.
- Third-party advertising.
- Developer advertising.
- Financial information collection by Shootr native code.
- Health, fitness, contacts, browsing history, search history, sensitive info, or diagnostics collection by current native code.

## Third-Party SDKs

Installed native dependencies:

- Capacitor
- Capacitor App
- Capacitor Browser
- Capacitor Keyboard
- Capacitor Status Bar

No Stripe, analytics, maps, push, camera, social login, crash reporting, attribution, or identity-verification native SDK is installed in this pass.

## Needs Manual Verification

- Xcode privacy report generation could not be performed because full Xcode is not selected on this machine.
- Required-reason API usage must be checked again after adding real secure storage, analytics, maps, payments, push, camera, or auth SDKs.
- App Store Connect privacy labels still require owner/legal review before submission.

