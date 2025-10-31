# Android Local QR Generation - Quick Start

## 🚀 Setup in 3 Steps

### 1. Add Your Secret Key
Edit `android/gradle.properties`:
```properties
QR_SECRET=your-secret-key-here
```
> ⚠️ **Important**: Use the **exact same secret** as your server's `QR_SECRET` environment variable

### 2. Sync and Build
```bash
npm run mobile:sync
npm run mobile:open
```

### 3. Done! 
The app will now generate QR codes locally on Android devices. No code changes needed!

---

## 🔍 How to Verify It's Working

### On Android (Native App)
1. Open a booking with a QR code
2. Check Logcat in Android Studio
3. Look for: `"Generating QR tokens locally on Android"`

### On Web Browser
1. Open the same page in a browser
2. Check browser console
3. Look for: `"Generating QR tokens from server"`

---

## 📦 What Was Changed

### New Files
- `android/app/src/main/java/com/myticket/app/QrTokenPlugin.java` - Native QR generator
- `app/lib/qrTokenPlugin.ts` - Capacitor plugin interface
- `app/lib/qrTokenGenerator.ts` - Platform-agnostic hook

### Modified Files
- `android/app/src/main/java/com/myticket/app/MainActivity.java` - Registered the plugin
- `android/app/build.gradle` - Added BuildConfig for secret
- `android/gradle.properties` - Added QR_SECRET field
- `app/bookings/[id]/page.tsx` - Uses new generator
- `app/my-bookings/[eventId]/page.tsx` - Uses new generator

---

## ✅ Benefits

- ✅ **Works Offline**: Generate QR codes without internet
- ✅ **Instant**: No server round-trip needed
- ✅ **Reduced Cost**: Fewer Convex action calls
- ✅ **Same Security**: Uses identical HMAC-SHA256 algorithm

---

## 🔒 Security Notes

1. **Keep `QR_SECRET` secure** - Don't commit it to git if you add the actual value
2. **Use the same secret** on server and Android
3. **For production**: Consider adding `gradle.properties` to `.gitignore` and using environment variables

---

## 📖 Full Documentation

See `ANDROID_QR_SETUP.md` for detailed documentation including:
- Security best practices
- Troubleshooting guide
- Architecture details
- Advanced configuration options

