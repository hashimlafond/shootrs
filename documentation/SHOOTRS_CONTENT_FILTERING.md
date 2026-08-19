# Shootrs Content Filtering

## Text Filtering

Build 8 adds a simple prohibited-phrase filter for user-entered text fields, including:

- booking notes
- contact/profile draft text
- Shootr application text
- support/report comments

Clearly prohibited phrases are rejected or sanitized. The support report form asks users to summarize abusive content rather than repeating prohibited language.

## Image Moderation

Automated image moderation is not currently implemented. The app does not claim automated image moderation.

Image controls implemented:

- delivered photos can be reported
- users connected to photos can be blocked
- admin can mark content removed
- removed content is suppressed from gallery views

## Blocked-User Filtering

Content from blocked users is not shown in normal discovery, match cards, public profiles, or galleries.

## Removed-Content Filtering

Content IDs marked in `removedContent[]` with status `removed` are hidden.

## Limitations

Production needs server-side filtering and storage enforcement so blocked/removed content is suppressed across devices, not just in local prototype storage.
