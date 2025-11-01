// Service Worker for Offline Caching
const CACHE_VERSION = 'v1';
const CACHE_NAME = `myticket-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `myticket-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `myticket-dynamic-${CACHE_VERSION}`;

// Assets to cache immediately on install
// Note: In production, Next.js generates specific file names with hashes
const STATIC_ASSETS = [
  '/',
  '/myticket_logo.png',
  '/next.svg',
  '/vercel.svg',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[Service Worker] Failed to cache some assets:', err);
        // Continue even if some assets fail to cache
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== STATIC_CACHE_NAME &&
              name !== DYNAMIC_CACHE_NAME &&
              name !== CACHE_NAME
            );
          })
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip Convex WebSocket connections
  if (url.pathname.includes('/api/convex') || url.protocol === 'wss:' || url.protocol === 'ws:') {
    return;
  }

  event.respondWith(
    handleFetch(request)
  );
});

// Main fetch handler
async function handleFetch(request) {
  const url = new URL(request.url);
  
  // For navigation requests (HTML pages), use network-first strategy
  if (request.mode === 'navigate') {
    return handleNavigationRequest(request);
  }
  
  // For Next.js static assets, use cache-first strategy
  if (url.pathname.startsWith('/_next/') || 
      url.pathname.match(/\.(js|css|woff2?)$/)) {
    return handleStaticAsset(request);
  }
  
  // For other requests, use network-first with cache fallback
  return handleDynamicRequest(request);
}

// Handle navigation (HTML pages)
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses
    if (response && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed - try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[Service Worker] Serving cached page:', request.url);
      return cachedResponse;
    }
    
    // If no cache, try to return the root page (SPA shell)
    const rootCache = await caches.match('/');
    if (rootCache) {
      console.log('[Service Worker] Serving root page for:', request.url);
      return rootCache;
    }
    
    // Last resort - offline page
    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Offline - MyTicket</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #0f172a;
              color: #f1f5f9;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
            h1 {
              font-size: 2rem;
              margin-bottom: 1rem;
            }
            p {
              color: #94a3b8;
              margin-bottom: 2rem;
            }
            .icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📡</div>
            <h1>You're offline</h1>
            <p>Please check your internet connection and try again.</p>
          </div>
        </body>
      </html>`,
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}

// Handle static assets (JS, CSS, fonts)
async function handleStaticAsset(request) {
  // Try cache first for static assets
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fetch from network
    const response = await fetch(request);
    
    // Cache successful responses
    if (response && response.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // If both cache and network fail, return error
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Handle dynamic requests (images, API, etc.)
async function handleDynamicRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses
    if (response && response.status === 200) {
      const cacheStrategy = getCacheStrategy(request);
      
      if (cacheStrategy.shouldCache) {
        const cache = await caches.open(cacheStrategy.cacheName);
        cache.put(request, response.clone());
      }
    }
    
    return response;
  } catch (error) {
    // Network failed - try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error response
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Cache strategy helper
function getCacheStrategy(request) {
  const url = new URL(request.url);

  // Static assets - cache forever
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|ico|woff|woff2|ttf|eot|webp)$/) ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname === '/myticket_logo.png'
  ) {
    return {
      shouldCache: true,
      cacheName: STATIC_CACHE_NAME,
    };
  }

  // Images and media
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|avif|ico)$/)) {
    return {
      shouldCache: true,
      cacheName: DYNAMIC_CACHE_NAME,
    };
  }

  // API routes - cache but prefer network
  if (url.pathname.startsWith('/api/')) {
    return {
      shouldCache: true,
      cacheName: DYNAMIC_CACHE_NAME,
    };
  }

  // HTML pages - cache for offline
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    return {
      shouldCache: true,
      cacheName: DYNAMIC_CACHE_NAME,
    };
  }

  // Default - cache it
  return {
    shouldCache: true,
    cacheName: DYNAMIC_CACHE_NAME,
  };
}

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

