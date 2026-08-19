# Internal TestFlight Checklist

Date: 2026-07-31

## Account And App Store Connect

- [ ] Apple Developer membership active.
- [ ] Legal entity and account-holder information complete.
- [ ] App ID created.
- [ ] Bundle identifier approved.
- [ ] App Store Connect app record created.
- [ ] Privacy Policy URL available.
- [ ] Support URL available.
- [ ] Marketing URL available if needed.

## Native Project

- [x] `ios/` project exists.
- [x] Production web assets copied into `ios/App/App/public`.
- [x] App icon asset present.
- [x] `Info.plist` contains location, camera, and photo-library usage descriptions.
- [x] `PrivacyInfo.xcprivacy` exists.
- [x] Privacy manifest is included in target resources.
- [x] No entitlements file or extra capabilities are enabled.
- [ ] Full Xcode installed and selected.
- [ ] Debug build succeeds.
- [ ] Simulator launch succeeds.
- [ ] Physical-device launch succeeds.

## Signing

- [ ] Team selected in Xcode.
- [ ] Development certificate available locally.
- [ ] Distribution certificate available locally.
- [ ] Provisioning profile generated or automatic signing confirmed.
- [ ] Version and build number confirmed.

## Release Environment

- [ ] Demo mode disabled for Release/reviewer build.
- [ ] No localhost endpoints.
- [ ] No temporary tunnel URLs.
- [ ] No fake marketplace data in review mode.
- [ ] No production charges.
- [ ] Sandbox payment provider configured before any paid booking test.
- [ ] Reviewer accounts prepared without real credentials in source.

## App Review Risk Controls

- [ ] Account deletion is server-backed.
- [ ] Auth is production-backed.
- [ ] Reports and blocks reach a moderation/support system.
- [ ] Private galleries use authenticated storage/share-link permissions.
- [ ] Location permission has denial fallback.
- [ ] Camera/photo-library denial fallback works.
- [ ] External legal/support links work on device.
- [ ] Offline and slow-network states tested.

## Upload

- [ ] Archive created.
- [ ] Archive validated.
- [ ] Build uploaded.
- [ ] Build processed.
- [ ] Export compliance answered.
- [ ] Internal tester group created.
- [ ] Internal tester invitation sent.
- [ ] Smoke test after TestFlight install.

