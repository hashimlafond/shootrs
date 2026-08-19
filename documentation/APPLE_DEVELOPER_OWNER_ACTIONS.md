# Apple Developer Owner Actions

Date: 2026-07-31

These steps require the account holder or someone with Apple Developer access. Do not put credentials, certificates, provisioning profiles, or private keys in the repository.

1. Install full Xcode from the Mac App Store or Apple Developer Downloads.
2. Open Xcode once and accept required license/components.
3. Select full Xcode:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

4. Confirm:

```bash
xcodebuild -version
```

5. In Apple Developer, create or confirm the App ID for the approved bundle identifier. Current placeholder/configured ID is `com.shootr.app`.
6. In App Store Connect, create the Shootr app record.
7. Open `ios/App/App.xcodeproj` in Xcode.
8. Select the `App` target.
9. Set the display name to `Shootr` if Xcode shows anything else.
10. Confirm bundle identifier ownership. Replace `com.shootr.app` if Apple requires a different approved ID.
11. Select the Apple Developer team.
12. Use automatic signing for internal TestFlight unless your account requires manual signing.
13. Confirm capabilities remain minimal. Do not enable Push Notifications, Associated Domains, Sign in with Apple, Background Modes, Apple Pay, or Keychain Sharing until the matching implementation exists.
14. Build Debug on an iPhone simulator.
15. Test fresh install, first launch, principal routes, location denial, file upload denial, support report, block user, and delete account.
16. Create an archive with Release configuration only after demo/prototype mode is disabled for the reviewer environment.
17. Validate the archive in Xcode Organizer.
18. Upload to App Store Connect internal TestFlight.
19. Add internal testers.
20. Smoke test the TestFlight build on a physical iPhone.

Do not submit to App Review from this pass. Shootr still needs production auth, backend deletion, sandbox payments, moderation, and review environment work.

