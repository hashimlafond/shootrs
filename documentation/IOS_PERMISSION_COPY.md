# iOS Permission Copy

Date: 2026-07-31

This file documents native iOS permission strings and when Shootr should request them.

## Location When In Use

- Info.plist key: `NSLocationWhenInUseUsageDescription`
- Current string: `Shootr uses your location to find nearby Shootrs and estimate arrival time after you tap Use Current Location.`
- Prompt timing: only after the user taps `Use Current Location`.
- Denial fallback: manual address/search flow.
- Background access: not requested.
- Release note: do not add Always Location unless live background tracking is actually implemented and legally reviewed.

## Camera

- Info.plist key: `NSCameraUsageDescription`
- Current string: `Shootr uses the camera only when you choose to take a profile, verification, reference, or incident photo.`
- Prompt timing: only after the user chooses an in-app capture action.
- Denial fallback: upload an existing photo or continue without optional media.
- Background access: not applicable.

## Photo Library Read

- Info.plist key: `NSPhotoLibraryUsageDescription`
- Current string: `Shootr uses your photo library only when you choose photos to upload for your profile, portfolio, support report, or gallery.`
- Prompt timing: only after the user chooses an upload action.
- Denial fallback: continue without upload or choose another file source.

## Photo Library Add

- Info.plist key: `NSPhotoLibraryAddUsageDescription`
- Current string: `Shootr saves photos to your library only when you choose to download delivered moments.`
- Prompt timing: only after the user chooses to save delivered photos.
- Denial fallback: keep photos available in Moments or share link where allowed.

## Notifications

- Info.plist key: none currently required for the installed native stack.
- Current status: push notifications are disabled in app settings and no Capacitor Push Notifications plugin is installed.
- Prompt timing: do not request notification permission in this build.
- Future string: explain booking updates, gallery delivery, review reminders, and payout updates before the system prompt.
- Required before enabling: APNs entitlement, token registration, token refresh, invalid-token removal, deep-link routing, denied-state UI, and no sensitive notification previews.

## Permissions Not Requested

- Always Location
- Background Location
- Microphone
- Contacts
- Bluetooth
- Local Network
- App Tracking Transparency
- Face ID
- Calendars
- Motion
- Background processing

