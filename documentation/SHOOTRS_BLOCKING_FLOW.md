# Shootrs Blocking Flow

## Where Block Appears

- Shootr match cards
- Public Shootr profile
- Delivered Moments gallery
- Support report form

## Data Model

Stored in local prototype storage:

- `blocks[]`
- `moderationEvents[]`

Block fields:

- blocker user ID
- blocked user ID
- content ID when available
- reason
- context
- status
- timestamp
- build number

## Immediate UI Removal

When User A blocks User B, the app rerenders immediately and filters User B out of:

- normal Shootr discovery
- match cards
- public profile availability
- gallery content connected to the blocked user

## Moderation Notification

Every block creates a `user_blocked` moderation event with a 24-hour review signal.

## Unblock Behavior

Unblock is not exposed in V1. Admins can inspect block records. A production unblock control should change `blocks[].status` from `active` to `inactive`.

## Offline/Persistence Behavior

In the prototype, blocks persist in local storage across app relaunch on the same device. Production must sync blocks to the backend.
