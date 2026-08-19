# Shootrs EULA Implementation

## Screen Location

- `/sign-in`
- `/sign-up`
- `/forgot-password`
- `/verify`
- `/app/profile/become-a-shootr` before a Shootr application can start

## Acceptance Flow

The user sees a Terms/EULA panel before continuing. The checkbox is not checked by default on a fresh install. The app prevents login/onboarding continuation until the checkbox is selected.

## Terms Version

`shootrs-eula-v1.2-build8`

## Storage

Local prototype storage:

- Key: `shootrs-eula-acceptance-v1.2-build8`
- Store field: `termsAcceptances[]`

Stored values:

- acceptance ID
- local user ID placeholder
- accepted timestamp
- Terms version
- source
- build number

## Refusal Behavior

If the user does not accept, the app stays on the auth/onboarding screen and shows:

`You must agree to the Terms/EULA before continuing.`

## Later Terms Updates

Changing `termsVersion` requires re-acceptance because the stored accepted version must match the current version.

## Legal Note

The Terms/EULA copy is product implementation text for App Review testing and requires attorney review before public launch.
