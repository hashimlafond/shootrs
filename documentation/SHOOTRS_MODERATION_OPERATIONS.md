# Shootrs Moderation Operations

## SLA

Shootrs will review objectionable-content reports within 24 hours.

## Triage Workflow

1. Open `/admin/incidents`.
2. Review new reports first.
3. Prioritize reports marked overdue or urgent safety.
4. Review reported content, reported user, reporter comment, and content ID.
5. Record the action taken.

## Removal Workflow

Use `Remove Content` to add the content ID to `removedContent[]`. Removed content disappears from user-visible gallery/profile surfaces.

## Suspension/Ban Workflow

Use `Suspend User` to add the reported user to `suspensions[]`. Suspended users are filtered out of discovery and relevant visible surfaces.

## Restoration Workflow

Use `Restore` to move a removed content record to restored status when a report is dismissed or reversed.

## Dismissal Workflow

Use `Dismiss` when a report does not violate policy. The report is marked dismissed with review timestamp and action.

## Data Retained For Audit

- reports
- incidents/support cases
- block events
- moderation events
- moderation actions
- content removal records
- suspension records
- timestamps
- build number

## Production Note

The current queue is local prototype storage. Production must use authenticated backend admin access, audit logs, staff permissions, and durable storage.
