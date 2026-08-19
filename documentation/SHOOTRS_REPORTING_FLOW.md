# Shootrs Reporting Flow

## Entry Points

- `/app/support`
- Delivered Moments detail report links
- Shootr match cards
- Public Shootr profile
- Profile > Support > Report Content or User

## Report Reasons

- Harassment or abusive behavior
- Hate or discrimination
- Sexual or inappropriate content
- Violence or threats
- Spam or scam
- Impersonation
- Illegal activity
- Privacy violation
- Other

## Stored Report Fields

- reporter user ID
- reported user ID
- content ID
- content type
- category
- optional comment
- context
- app version
- build number
- status: `new`, `reviewed`, `actioned`, `dismissed`
- created timestamp

## Backend Storage

Current Build 8 prototype storage:

- `reports[]`
- `incidents[]`
- `supportCases[]`
- `moderationEvents[]`

Production requirement: sync these records to a secure backend accessible to support/admin staff.

## Admin Visibility

Reports appear in `/admin/incidents` with:

- report status
- report age
- 24-hour due timing
- content ID
- reported user ID
- moderation actions

## Submission Behavior

The user must confirm the report before submission. Duplicate accidental submissions with the same user/content/category inside 10 seconds are ignored.

After submission, the app confirms that the report was sent and that objectionable-content reports are reviewed within 24 hours.
