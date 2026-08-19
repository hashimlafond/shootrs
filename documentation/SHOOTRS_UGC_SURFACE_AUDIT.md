# Shootrs UGC Surface Audit

Scope: Build 8 Guideline 1.2 safety pass. Current app is a static Capacitor/Vite implementation with local prototype storage and review/demo data.

## Surfaces Apple Likely Considered User-Generated Content

| Surface | Where it appears | Creator | Viewer | Public/private | Reportable | Blockable | V1 decision |
|---|---|---|---|---|---|---|---|
| Profile photo | Match cards, public profiles, profile settings | Shootr | Customers | Public/discovery | Yes | Yes | Keep, but hide after block/suspension/removal |
| Shootr portfolio images | Match cards, public profiles, onboarding portfolio upload | Shootr | Customers/admin | Public/discovery | Yes | Yes | Keep as essential discovery UGC |
| Delivered Moments | Moments gallery/detail | Shootr uploads for customer | Customer/Shootr with access | Private | Yes | Yes | Keep as essential delivery UGC |
| Booking notes/descriptions | Booking request, job cards | Customer | Shootr/admin | Private booking | Yes through support | Yes where user known | Keep, filtered for prohibited text |
| Shootr bio/profile text | Profile/onboarding data | Shootr | Customers/admin | Public/discovery | Yes | Yes | Keep, filtered for prohibited text |
| Reviews/ratings | Review service/model placeholder | Customer/Shootr | Users/admin | Future/public | Needs report path | User block supported | Not prominent in V1; keep placeholder only |
| Messages | Support/message placeholders | Customer/Shootr | Participants/admin | Private | Yes through support | Yes | Keep as placeholder; production must moderate |
| Customer-uploaded reference photos | Future upload/support/reference paths | Customer | Shootr/admin | Private booking/support | Yes | User block supported | Keep only where contextual |
| Public galleries/share links | Gallery/share-link service | Customer controls link | Link recipients | Private link | Yes | Yes | Keep private; removed/blocked content hidden |
| Support reports/comments | Support form | User | Admin/developer | Internal | Internal moderation | N/A | Keep; comments filtered |

## Removed Or Suppressed In V1

No essential booking or photo delivery functionality was removed. Instead, Build 8 suppresses:

- Content from blocked users.
- Content from suspended users.
- Gallery/profile content marked administratively removed.
- Clearly prohibited text inputs through a simple V1 filter.

## Remaining Backend Gap

The current implementation stores reports/blocks/moderation actions in local prototype storage. Production must sync these records to a secure backend moderation queue before broad release.
