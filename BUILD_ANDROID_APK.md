# Building Android Debug APK

## Quick Build (Recommended)

### Full Build (Builds web app + syncs + builds APK)
```bash
npm run mobile:build-apk
```

This command will:
1. ✅ Build your Next.js web app (`npm run build:mobile`)
2. ✅ Sync Capacitor with latest web assets (`npm run mobile:sync`)
3. ✅ Build the debug APK (`gradlew.bat assembleDebug`)

### Fast Build (Skip web build and sync)
If you've already built and synced, you can just build the APK:
```bash
npm run mobile:build-apk:fast
```

## Manual Build Steps

If you prefer to do it step by step:

### 1. Build the web app
```bash
npm run build:mobile
```

### 2. Sync Capacitor
```bash
npm run mobile:sync
```

### 3. Build the APK
**Windows:**
```bash
cd android
gradlew.bat assembleDebug
```

**Linux/Mac:**
```bash
cd android
./gradlew assembleDebug
```

## APK Location

After building, your debug APK will be located at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Installing the APK

### Via ADB (Android Debug Bridge)
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Via Android Studio
1. Open Android Studio
2. Go to `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
3. Wait for build to complete
4. Click "locate" when notification appears

### Via File Transfer
1. Copy `app-debug.apk` to your Android device
2. Enable "Install from Unknown Sources" in Android settings
3. Open the APK file on your device
4. Follow installation prompts

## Troubleshooting

### "gradlew.bat not found"
Make sure you're in the `android` directory and the file exists. If not:
```bash
cd android
# Check if gradlew.bat exists
dir gradlew.bat
```

### "Build failed" - Check QR_SECRET
Make sure you've set `QR_SECRET` in `android/gradle.properties`:
```properties
QR_SECRET=your-secret-key-here
```

### "Permission denied" (Linux/Mac)
Make gradlew executable:
```bash
chmod +x android/gradlew
```

### Build takes too long
- First build always takes longer (downloading dependencies)
- Subsequent builds are faster
- Use `mobile:build-apk:fast` if you haven't changed web code

### "Failed to sync Capacitor"
Make sure you're in the project root when running sync commands.

## Build Variants

### Debug APK (Default)
```bash
npm run mobile:build-apk
# or
cd android && gradlew.bat assembleDebug
```

### Release APK
```bash
cd android && gradlew.bat assembleRelease
```
**Note:** Release builds require signing configuration (not covered here).

## Next Steps After Building

1. **Test the APK** - Install on a device or emulator
2. **Verify QR Generation** - Check that local QR generation works
3. **Check Logs** - Use `adb logcat` to see console logs
4. **Test Offline** - Verify QR codes work without internet

## Performance Tips

- Use `mobile:build-apk:fast` when you only changed native code
- Use full `mobile:build-apk` when you changed web code
- First build downloads dependencies (~5-10 minutes)
- Subsequent builds are much faster (~1-2 minutes)

