/**
 * Service Worker Registration
 */

export function registerServiceWorker() {
  // Check if browser supports service workers
  if (typeof window === "undefined") {
    console.log("[Service Worker] Running on server, skipping registration");
    return;
  }

  if (!("serviceWorker" in navigator)) {
    console.warn("[Service Worker] Not supported in this browser");
    return;
  }

  // Check if we're on localhost or https (required for service workers)
  const isLocalhost = window.location.hostname === "localhost" || 
                      window.location.hostname === "127.0.0.1";
  const isHttps = window.location.protocol === "https:";

  if (!isLocalhost && !isHttps) {
    console.warn("[Service Worker] Requires HTTPS or localhost");
    return;
  }

  console.log("[Service Worker] Starting registration...");

  // Function to perform registration
  const doRegister = () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[Service Worker] ✅ Registered successfully!");
        console.log("[Service Worker] Scope:", registration.scope);
        console.log("[Service Worker] State:", registration.installing?.state || registration.waiting?.state || registration.active?.state);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            console.log("[Service Worker] Update found, installing...");
            newWorker.addEventListener("statechange", () => {
              console.log("[Service Worker] State changed to:", newWorker.state);
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("[Service Worker] 🔄 New version available! Reload to update.");
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error("[Service Worker] ❌ Registration failed:", error);
        console.error("[Service Worker] Error details:", error.message);
        
        // Check if sw.js is accessible
        fetch("/sw.js")
          .then((response) => {
            if (response.ok) {
              console.error("[Service Worker] sw.js is accessible but registration failed");
            } else {
              console.error("[Service Worker] sw.js returned status:", response.status);
            }
          })
          .catch((fetchError) => {
            console.error("[Service Worker] sw.js is not accessible:", fetchError);
          });
      });
  };

  // Register immediately if page is already loaded, otherwise wait for load
  if (document.readyState === "complete") {
    console.log("[Service Worker] Page already loaded, registering immediately");
    doRegister();
  } else {
    console.log("[Service Worker] Waiting for page load...");
    window.addEventListener("load", doRegister);
  }

  // Handle service worker controller change (page refresh after update)
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      console.log("[Service Worker] Controller changed, reloading...");
      refreshing = true;
      window.location.reload();
    }
  });
}

export function unregisterServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.ready.then((registration) => {
    registration.unregister();
  });
}

