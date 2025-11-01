# Offline Caching & PWA Support

MyTicket now includes full offline support with service worker caching and an offline indicator.

## Features

### ✅ Service Worker Caching
- **Static Assets**: Images, CSS, JS files are cached for offline access
- **HTML Pages**: Pages are cached for offline viewing
- **API Responses**: API responses are cached with network-first strategy
- **Automatic Updates**: Service worker checks for updates hourly

### ✅ Offline Indicator
- Visual banner shows when you're offline
- Displays "Back online" message when connection is restored
- Non-intrusive, appears at the top of the screen

### ✅ Data Caching
- Convex queries cached in localStorage
- QR codes cached in sessionStorage
- Booking data cached for offline QR generation (Android)

## How It Works

### Service Worker (`public/sw.js`)
1. **Install**: Caches static assets on first load
2. **Activate**: Cleans up old caches
3. **Fetch**: Serves cached content when offline, falls back to network when online

### Cache Strategies

#### Static Assets (CSS, JS, Images)
- **Strategy**: Cache First
- **TTL**: Forever (until cache cleared)
- **Cache Name**: `myticket-static-v1`

#### HTML Pages
- **Strategy**: Network First, Cache Fallback
- **TTL**: Until updated
- **Cache Name**: `myticket-dynamic-v1`

#### API Routes
- **Strategy**: Network First, Cache Fallback
- **TTL**: Until updated
- **Cache Name**: `myticket-dynamic-v1`

### Offline Data Management

#### QR Codes
- Cached in `sessionStorage` with expiration times
- Automatically loads cached QR codes when offline
- Works seamlessly with Android local QR generation

#### Booking Data
- Cached in `sessionStorage` for offline QR generation
- Includes `ticketId` and `scanned` status
- Used by Android app to generate QR codes offline

#### Convex Queries
- Automatically cached when online
- Served from cache when offline
- Uses localStorage with versioning

## Usage

### Offline Indicator Hook
```typescript
import { useOffline } from "@/app/lib/useOffline";

function MyComponent() {
  const isOffline = useOffline();
  
  if (isOffline) {
    return <div>You're offline</div>;
  }
  
  return <div>Online content</div>;
}
```

### Cache Management
```typescript
import { 
  getCachedData, 
  setCachedData, 
  clearCachedData 
} from "@/app/lib/offlineCache";

// Get cached data
const data = await getCachedData<MyType>("my-key", 60000); // 60s max age

// Set cached data
await setCachedData("my-key", myData, 3600000); // 1 hour TTL

// Clear cached data
clearCachedData("my-key");
```

## Testing Offline Mode

### Browser DevTools
1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers**
4. Check **Offline** checkbox
5. Refresh the page

### Mobile Testing
1. Enable Airplane Mode
2. Open the app
3. Verify offline indicator appears
4. Verify cached content loads

## Cache Management

### Clear All Cache
The service worker automatically manages cache:
- Old caches are deleted on update
- Expired entries are removed
- Storage quota is managed automatically

### Manual Cache Clear
Users can clear cache via browser settings:
- Chrome: Settings → Privacy → Clear browsing data
- Firefox: Settings → Privacy → Clear Data

## PWA Support

The app includes a `manifest.json` for Progressive Web App features:
- **Installable**: Can be installed to home screen
- **Standalone Mode**: Runs without browser UI
- **Icons**: Uses MyTicket logo as app icon
- **Theme Color**: Matches app theme (#483d8b)

### Install on Mobile
1. **Android**: Chrome menu → "Add to Home Screen"
2. **iOS**: Safari Share → "Add to Home Screen"

## Limitations

### Convex Real-time Queries
- WebSocket connections don't work offline
- Cached data is shown instead
- Updates sync when back online

### Dynamic Content
- Some content requires internet (payment processing, etc.)
- User actions may queue until online
- Error messages shown for failed operations

### Cache Size
- localStorage has ~5-10MB limit
- sessionStorage has ~5-10MB limit
- Service worker cache has browser-dependent limits
- Old cache entries auto-cleared when quota exceeded

## Troubleshooting

### Service Worker Not Registering
1. Check browser console for errors
2. Verify `/sw.js` is accessible
3. Check HTTPS (required for service workers)
4. Clear browser cache and retry

### Cache Not Updating
1. Unregister service worker in DevTools
2. Clear all caches
3. Refresh page (hard refresh: Ctrl+Shift+R)

### Offline Indicator Not Showing
1. Check browser supports `navigator.onLine`
2. Verify `OfflineIndicator` component is in layout
3. Check console for errors

## Best Practices

1. **Cache Key Names**: Use descriptive, versioned keys
2. **TTL Values**: Set appropriate expiration times
3. **Cache Size**: Monitor and clean up when needed
4. **User Feedback**: Always show offline status
5. **Error Handling**: Gracefully handle offline scenarios

## Future Enhancements

- [ ] Background sync for queued actions
- [ ] IndexedDB for larger data storage
- [ ] Push notifications for updates
- [ ] Offline analytics
- [ ] Cache preloading strategies

