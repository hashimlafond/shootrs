# Privacy Data Map

Date: 2026-07-30

This map reflects current implementation plus known planned production behavior. It is not legal advice.

| Data Type | Purpose | Collection Point | Current Storage | Third Parties | Retention | Deletion Behavior | Linked to Identity | Tracking |
|---|---|---|---|---|---|---|---|---|
| Name | Account/profile and booking contact | Profile, sign-up, Shootr onboarding | localStorage prototype | none current | until local deletion | local deletion flow clears prototype profile data | yes | no |
| Email | receipts, recovery, support, application updates | sign-in, booking contact, onboarding, support | localStorage prototype | none current | until local deletion | local deletion flow clears prototype state | yes | no |
| Phone | booking updates, verification, support | booking contact, onboarding | localStorage prototype | none current; SMS planned | until local deletion | local deletion flow clears prototype state | yes | no |
| Date of birth | adult Shootr eligibility | Shootr onboarding | localStorage prototype | none current | until local deletion | local deletion clears draft/application state | yes | no |
| Approximate location | find nearby Shootrs | booking location | booking draft/localStorage | maps provider planned | booking lifecycle | deleted with draft/account where allowed | yes | no |
| Precise location | optional nearby search | Use Current Location action | localStorage prototype when granted | maps/geolocation provider planned | booking lifecycle | deleted with draft/account where allowed | yes | no |
| Live provider location | tracker and ETA | planned active booking state | mock only | maps/ETA provider planned | active booking period | must be deleted/anonymized after operational need | yes | no |
| Payment info | authorize/capture/refund real-world services | planned checkout | mock payment object only | payment processor planned | legal/payment retention | raw card data should never be stored by Shootr | yes | no |
| Payout info | pay Shootrs | planned payout provider | not stored; placeholder only | payout provider planned | tax/legal requirements | retained by provider/legal rules | yes | no |
| Photos/media | private Moments gallery and portfolio review | upload/gallery/onboarding | mock/local assets | storage provider planned | configurable, currently 90 days | delete or revoke links except legally retained reports | yes | no |
| Share links | private gallery sharing | gallery detail | mock generated links | none current | TTL 24 hours in prototype | deletion flow revokes prototype links | yes | no |
| Reviews | trust and quality | post-completion planned | localStorage model | none current | service lifetime | anonymize or delete when allowed | yes | no |
| Support reports/incidents | safety, moderation, disputes | `/app/support` | localStorage prototype | support tool planned | legal/safety retention | may be retained when legally needed | yes | no |
| Blocks | user safety | `/app/support` | localStorage prototype | none current | account lifetime | deleted/anonymized except safety records | yes | no |
| Notifications | booking/gallery/payout updates | notification service | localStorage prototype | push provider planned | operational | cleared in local deletion | yes | no |
| Analytics | product diagnostics | `track()` local events | localStorage prototype | none current | not defined | local deletion clears analytics | potentially | no current cross-app tracking |

## Privacy Manifest Status

No native iOS project or `PrivacyInfo.xcprivacy` exists in the repository. A valid privacy manifest must be added to the iOS app bundle before TestFlight/App Store submission if the native app or included SDKs collect data or use required-reason APIs.

