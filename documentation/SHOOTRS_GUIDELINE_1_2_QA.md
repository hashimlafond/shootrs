# Shootrs Guideline 1.2 QA

Status: Implementation complete in code; physical-device recording still required by owner before App Review response.

## Required Physical Device Test

- Device used: Owner must fill in
- iOS version: Owner must fill in
- Build configuration: Release, version 1.0, build 8

## Checklist

| Requirement | Status | Notes |
|---|---|---|
| Terms/EULA shown before registration or login | Implemented, needs physical-device recording | Auth screens show EULA gate before login buttons can proceed |
| User must actively agree | Implemented | Fresh install checkbox is unchecked |
| Refusing Terms prevents login/registration | Implemented | Auth/onboarding continuation is blocked |
| Report mechanism visible | Implemented | Support, Moments, match cards, public profile |
| Report is stored | Implemented in local prototype storage | Production backend sync still required |
| Report visible to admin | Implemented | `/admin/incidents` |
| Block mechanism visible | Implemented | Match cards, profile, Moments, support |
| Blocked content disappears immediately | Implemented | Rerender filters blocked user/content |
| Block persists after relaunch | Implemented locally | Same-device local storage |
| Developer receives moderation signal | Implemented locally | `moderationEvents[]` |
| Admin can remove content | Implemented | `/admin/incidents` action |
| Admin can suspend user | Implemented | `/admin/incidents` action |
| Removed content disappears | Implemented | `removedContent[]` filter |
| Suspended user hidden | Implemented | `suspensions[]` filter |
| Normal users cannot access admin tools | Partially implemented | Role guard exists; production auth required |
| Physical-device recording captured | Not complete | Must record on real iPhone |

## Required Recording Filename

`Shootrs_Guideline_1_2_Compliance_Build8.mov`
