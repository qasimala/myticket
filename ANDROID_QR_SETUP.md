# Android Local QR Code Generation Setup

This guide explains how to configure the Android app to generate QR codes locally using a baked-in secret key, eliminating the need to fetch QR codes from the server.

## How It Works

### Architecture
- **Web/Browser**: QR codes are generated on the server via Convex actions
- **Android Native**: QR codes are generated locally on the device using a native Capacitor plugin
- **Automatic Detection**: The app automatically detects the platform and uses the appropriate method

### Security
The secret key is:
1. Stored in `android/gradle.properties` (not committed to git)
2. Injected into the Android build via BuildConfig
3. Used to sign QR tokens with HMAC-SHA256 (same algorithm as server)
4. Never exposed to JavaScript or transmitted over the network

### Token Format
Both server and Android client generate identical tokens:
```json
{
  "bookingId": "j123456789",
  "ticketId": "k123456789",
  "ts": 12345,
  "sig": "abc123..."
}
```

Where:
- `ts` is a time slot (current time / 15000ms)
- `sig` is HMAC-SHA256(bookingId:ticketId:ts, secret)

## Setup Instructions

### 1. Add Secret Key to gradle.properties

Edit `android/gradle.properties` and add your QR secret key:

```properties
# QR Token Secret (keep this secure!)
QR_SECRET=your-secret-key-here
```

**IMPORTANT**: 
- Use the **same secret** as your server's `QR_SECRET` environment variable
- This file should be in `.gitignore` to prevent committing secrets
- The secret should be a long, random string (recommended: 64+ characters)

### 2. Alternative: Environment Variable

Instead of `gradle.properties`, you can set an environment variable:

**Windows (PowerShell)**:
```powershell
$env:QR_SECRET = "your-secret-key-here"
```

**Linux/Mac (Bash)**:
```bash
export QR_SECRET="your-secret-key-here"
```

### 3. Build the Android App

After configuring the secret:

```bash
# Sync Capacitor
npm run mobile:sync

# Open in Android Studio
npm run mobile:open

# Or build APK directly
npm run mobile:build-apk
```

### 4. Verify It's Working

In the Android app:
1. Open a booking with a QR code
2. Check the browser console (via Android Studio Logcat)
3. You should see: `"Generating QR tokens locally on Android"`

In the web app:
1. Open the same booking in a browser
2. Check the browser console
3. You should see: `"Generating QR tokens from server"`

## File Structure

```
android/
├── app/
│   ├── build.gradle                 # BuildConfig setup
│   └── src/main/java/com/myticket/app/
│       ├── MainActivity.java        # Plugin registration
│       └── QrTokenPlugin.java       # Native QR generation
│
app/
└── lib/
    ├── qrTokenPlugin.ts            # Capacitor plugin interface
    └── qrTokenGenerator.ts         # Platform-agnostic hook
```

## Usage in Code

The app automatically uses the correct method:

```typescript
import { useQrTokenGenerator } from "../../lib/qrTokenGenerator";

function MyComponent() {
  const { generateTokens, isUsingLocalGeneration } = useQrTokenGenerator();
  
  // This works on both web and Android
  const result = await generateTokens(bookingId, ticketId);
  
  // Check which method is being used
  console.log(isUsingLocalGeneration ? "Local" : "Server");
}
```

## Security Best Practices

1. **Never commit** `gradle.properties` with the secret
2. **Use different secrets** for development and production
3. **Rotate secrets** periodically
4. **Use strong secrets**: 64+ random characters
5. **Obfuscate release builds**: Enable ProGuard for production

### Additional Security (Optional)

For production apps, consider:
- Using Android Keystore for secret encryption
- Implementing certificate pinning
- Adding tamper detection
- Using NDK to store secrets in native code

## Troubleshooting

### "QR_SECRET not configured in build"
- Ensure `QR_SECRET` is in `gradle.properties` or environment variables
- Clean and rebuild: `cd android && ./gradlew clean`

### "Failed to generate tokens locally, falling back to server"
- Check Android Studio Logcat for detailed error messages
- Verify the plugin is registered in MainActivity
- Ensure Capacitor sync was successful

### QR codes don't scan properly
- Verify the secret matches the server secret **exactly**
- Check that time slots are synchronized (device time should be accurate)
- Test the same booking on web to compare QR values

### Plugin not found on Android
- Run `npm run mobile:sync` to sync the plugin
- Check that `registerPlugin(QrTokenPlugin.class)` is in MainActivity
- Rebuild the app completely

## Benefits

✅ **Offline-capable**: Generate QR codes without internet connection  
✅ **Reduced server load**: No API calls needed for QR generation  
✅ **Better performance**: Instant QR code generation  
✅ **Lower costs**: Fewer Convex action calls  
✅ **Improved privacy**: Booking data never sent to server for QR generation

## Limitations

- QR code generation is local, but **scanning still requires server verification**
- Secret key must be kept secure in the Android app
- Device time must be reasonably accurate (within ~30 seconds)
- Requires rebuilding the app if secret changes

