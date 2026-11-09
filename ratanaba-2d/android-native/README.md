# Android offline — Ratanabá Guardians 2D

A Java Activity embeds the current tested browser game, not the old Godot campaign. All code, sprite atlases, audio and HUD assets are bundled into the APK. The application serves its own local files at the reserved HTTPS `appassets.androidplatform.net` origin, giving localStorage a stable origin. It does not request Internet permission, expose a JavaScript interface, permit arbitrary navigation, or grant file/content access.

Package: `br.com.ratanaba.guardians2d`; version `0.7.0` / code `700`; Android 8.0+ (API26), target API35. Landscape, immersive fullscreen and hardware acceleration are enabled. Android's Back closes the backpack/menu dialog or pauses gameplay; from the main menu it asks before closing. Backgrounding pauses and saves. The native lifecycle adapter is `web/native-bridge.js` and is inactive in the ordinary browser build.

## Build

Install official SDK platform35 and build-tools35.0.1, plus a JDK17+ compiler. From the game project:

```sh
python3 tools/build_android.py --sdk "$ANDROID_SDK_ROOT"
```

No Gradle, Maven or third-party Android dependency is needed. The script compiles resources with aapt2, Java with javac (or the JDK compiler module), DEX with d8, aligns, signs and verifies the APK. It validates package/version/SDK, signature, ZIP alignment, DEX and the SHA256 of every bundled runtime file.

Output: `build/android/ratanaba-guardians-2d-v0.7.0-debug.apk` plus `android_validation.json`, signature/badging metadata and SHA256SUMS.

A development signing key is generated outside the game source at `../.privateandroid/guardians2d-debug.jks`, or use `--keystore` / `RATANABA_DEBUG_KEYSTORE`. Never commit a private signing key. The usual Android debug password is a development convention, not production signing. Keep this key locally to install later builds over this one. A CI build without a retained key uses a new temporary debug key and may require uninstalling an earlier build; uninstalling removes its local saves.

The APK is a sideloadable development build. It is not a Play Store release. Compilation and structural validation do not prove behavior on a physical Android device; consult the validation report for checks actually performed.
