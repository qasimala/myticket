# How to Test Offline Mode

## Important: Clear Cache First

Before testing, you need to clear the old service worker and cache:

### Method 1: DevTools (Recommended)
1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in the left sidebar
4. Click **Unregister** for any MyTicket service workers
5. Click **Storage** in the left sidebar
6. Click **Clear site data**
7. Refresh the page (Ctrl+Shift+R)

### Method 2: Incognito/Private Window
Open the app in an incognito/private window to test with a clean cache.

## Testing Steps

### 1. Visit Pages While Online
First, visit the pages you want to test offline so they get cached:

1. Go to homepage: `http://localhost:3000`
2. Sign in (if needed)
3. Visit My Bookings: `http://localhost:3000/my-bookings`
4. Click into a specific booking
5. Navigate around the app

**What's happening:** The service worker is caching:
- HTML pages you visit
- JavaScript bundles (Next.js code)
- Images and static assets
- Convex query results (in localStorage)

### 2. Verify Service Worker is Registered
1. Open DevTools → Application → Service Workers
2. You should see:
   - Status: **activated and is running**
   - Script URL: `/sw.js`

### 3. Go Offline
**Option A: DevTools**
1. Open DevTools (F12)
2. Go to **Network** tab
3. Check the **Offline** checkbox
4. Refresh the page (F5 or Ctrl+R)

**Option B: Airplane Mode**
1. Enable airplane mode on your device
2. Turn off WiFi
3. Refresh the page

### 4. Test Navigation
While offline, try:
- ✅ Homepage should load with cached data
- ✅ My Bookings should load with cached data
- ✅ Individual booking pages should work (with cached QR codes)
- ✅ Client-side navigation (clicking links) should work
- ✅ Offline indicator banner should appear at the top
- ⚠️ Convex queries will show cached data (if available)

## What Should Work Offline

### ✅ Fully Functional
- All pages you've visited while online
- Client-side navigation between pages
- Cached QR codes
- Cached booking data
- Images and static assets

### ⚠️ Limited Functionality
- Convex queries return cached data
- Real-time updates won't sync
- Payment processing won't work
- Creating new bookings won't work

### ❌ Won't Work
- Pages you haven't visited yet (no cache)
- Real-time data updates
- API calls that modify data
- Authentication (if not already authenticated)

## Debugging

### Service Worker Not Working?
1. Check console for errors
2. Make sure you're on `http://localhost:3000` (not file://)
3. Service workers require HTTPS in production (but localhost is OK)
4. Clear cache and try again

### Pages Still Show "No Internet"?
1. Make sure you visited the page while online first
2. Check Application → Cache Storage → See if pages are cached
3. Look for service worker errors in console
4. Try hard refresh (Ctrl+Shift+R) while online, then test offline

### Cached Data Not Showing?
1. Check localStorage for cached Convex queries
2. Make sure you're using `useCachedQuery` hook (not regular `useQuery`)
3. Check browser console for caching errors

## Monitoring

### Check What's Cached
1. DevTools → Application → Cache Storage
2. You should see:
   - `myticket-static-v1`: JS, CSS, fonts, images
   - `myticket-dynamic-v1`: HTML pages, API responses
3. Click each to see what's cached

### Check Convex Query Cache
1. DevTools → Application → Local Storage
2. Look for keys starting with `myticket_cache_`
3. These contain cached Convex query results

### View Service Worker Logs
1. DevTools → Console
2. Filter by "Service Worker"
3. You should see messages like:
   - `[Service Worker] Installing...`
   - `[Service Worker] Activated`
   - `[Service Worker] Serving cached page: ...`

## Production Testing

For production/deployed app:
1. Must use HTTPS (service workers don't work on HTTP in production)
2. Deploy your app
3. Visit pages while online
4. Enable airplane mode or disable network
5. Test offline functionality

## Troubleshooting Common Issues

### Issue: Service Worker Not Updating
**Solution:** 
- Unregister old service worker
- Clear all caches
- Hard refresh (Ctrl+Shift+R)

### Issue: Pages Load But Show Errors
**Solution:**
- Make sure Convex queries are cached (visit page while online)
- Use `useCachedQuery` instead of `useQuery`
- Check that localStorage isn't full

### Issue: Offline Indicator Not Showing
**Solution:**
- Check that `OfflineIndicator` component is in the layout
- Verify `useOffline` hook is working
- Check browser supports `navigator.onLine`

## Expected Behavior

### When Going Offline
1. Orange banner appears at top: "You're offline"
2. Pages continue to work with cached data
3. Cached data banner appears on pages: "Showing cached data"

### When Coming Back Online
1. Green banner appears: "Back online! Syncing..."
2. Data refreshes from server
3. Cached data banner disappears

