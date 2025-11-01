# Debugging Service Worker Registration

## Step 1: Check if sw.js is accessible

Open your browser and navigate to:
```
http://localhost:3000/sw.js
```

**Expected:** You should see the JavaScript code for the service worker.

**If you see 404 or error:**
- The file isn't being served properly
- Make sure `public/sw.js` exists
- Restart your Next.js dev server: `npm run dev`

## Step 2: Check Browser Console

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for messages starting with `[Service Worker]`

**Expected messages:**
```
[Service Worker] Starting registration...
[Service Worker] ✅ Registered successfully!
[Service Worker] Scope: http://localhost:3000/
```

**If you see errors:**
- Note the exact error message
- Common errors:
  - "Failed to register a ServiceWorker" - sw.js not accessible
  - "Script has unsupported MIME type" - server not serving as JavaScript
  - "SecurityError" - HTTPS required (but localhost should work)

## Step 3: Manual Registration Test

Open Console and run this:
```javascript
navigator.serviceWorker.register('/sw.js', { scope: '/' })
  .then(reg => console.log('Success!', reg))
  .catch(err => console.error('Failed:', err))
```

**This will:**
- Show if registration works manually
- Display the exact error if it fails

## Step 4: Check Service Worker Status

In DevTools:
1. Go to **Application** tab
2. Click **Service Workers** in sidebar

**You should see:**
- **Source**: `/sw.js`
- **Status**: `activated and is running`
- **Clients**: Should show your page

**If you only see "Service workers from other origins":**
- Your service worker isn't registered
- Go back to Step 1 and 2

## Step 5: Check Network Tab

1. Go to **Network** tab in DevTools
2. Refresh the page
3. Look for `/sw.js` request

**Expected:**
- Status: `200 OK`
- Type: `script`
- Size: Should show the file size

**If missing or 404:**
- Service worker file isn't being served
- Check that `public/sw.js` exists
- Restart dev server

## Common Issues & Solutions

### Issue: "Service workers from other origins" only

**Possible causes:**
1. Service worker not registered yet (first load)
2. Registration failed silently
3. sw.js not accessible

**Solutions:**
1. Check console for `[Service Worker]` messages
2. Try manual registration (Step 3)
3. Verify sw.js is accessible (Step 1)
4. Hard refresh: Ctrl+Shift+R

### Issue: sw.js returns 404

**Solution:**
```bash
# Make sure file exists
ls public/sw.js

# Restart dev server
npm run dev
```

### Issue: "SecurityError" or HTTPS required

**Solution:**
- Make sure you're using `http://localhost:3000` (not https://)
- Service workers require HTTPS in production, but localhost works with HTTP

### Issue: Service worker registered but not activating

**Solution:**
1. Close all tabs with your app
2. Go to Application → Service Workers
3. Click "Unregister" for any existing workers
4. Refresh the page

### Issue: Changes to sw.js not taking effect

**Solution:**
1. DevTools → Application → Service Workers
2. Check "Update on reload"
3. Click "Unregister"
4. Hard refresh (Ctrl+Shift+R)

## Verification Commands

Run these in your browser console:

### Check if service workers are supported
```javascript
'serviceWorker' in navigator
// Should return: true
```

### Check current registration
```javascript
navigator.serviceWorker.getRegistration()
  .then(reg => console.log(reg))
// Should show registration object or undefined
```

### Check controller
```javascript
navigator.serviceWorker.controller
// Should show service worker object if active
```

### Force update
```javascript
navigator.serviceWorker.getRegistration()
  .then(reg => reg?.update())
```

## Still Not Working?

If service worker still won't register after all steps:

1. **Try Incognito/Private Window**
   - Open app in incognito/private mode
   - Check if it registers there
   - If yes, clear your browser cache

2. **Check Browser Version**
   - Service workers require modern browsers
   - Chrome 40+, Firefox 44+, Safari 11.1+

3. **Check for Conflicting Extensions**
   - Disable browser extensions
   - Some extensions block service workers

4. **Production Build Test**
   ```bash
   npm run build
   npm start
   # Then test with http://localhost:3000
   ```

5. **Last Resort: Clear Everything**
   ```javascript
   // In console, run:
   navigator.serviceWorker.getRegistrations()
     .then(regs => regs.forEach(reg => reg.unregister()))
   
   // Then clear all site data:
   // DevTools → Application → Storage → Clear site data
   
   // Then hard refresh
   ```

## Next Steps After Registration Works

Once you see "✅ Registered successfully" in console:

1. Visit pages while online to cache them
2. Test offline mode (Network tab → Offline checkbox)
3. Verify cached pages load offline
4. Check that offline indicator appears

See `HOW_TO_TEST_OFFLINE.md` for complete testing guide.

