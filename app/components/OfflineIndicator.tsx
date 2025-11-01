"use client";

import { useOffline } from "../lib/useOffline";
import { useEffect, useState } from "react";

export default function OfflineIndicator() {
  const isOffline = useOffline();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setShow(true);
    } else {
      // Delay hiding to show reconnection message
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOffline]);

  if (!show) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        show ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div
        className={`mx-auto max-w-6xl px-4 py-3 ${
          isOffline
            ? "bg-orange-500/95 text-orange-50"
            : "bg-green-500/95 text-green-50"
        } shadow-lg backdrop-blur-sm`}
      >
        <div className="flex items-center justify-center gap-3">
          {isOffline ? (
            <>
              <svg
                className="h-5 w-5 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                />
              </svg>
              <p className="text-sm font-semibold">
                You&apos;re offline. Some features may be limited.
              </p>
            </>
          ) : (
            <>
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-sm font-semibold">
                Back online! Syncing your data...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

