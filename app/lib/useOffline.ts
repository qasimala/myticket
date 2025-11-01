"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect online/offline status
 */
export function useOffline() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Set initial state
    if (typeof navigator !== "undefined" && "onLine" in navigator) {
      setIsOffline(!navigator.onLine);
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOffline;
}

