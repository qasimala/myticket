"use client";

import { useEffect, useMemo, useRef } from "react";
import { api } from "../../convex/_generated/api";
import { useOffline } from "../lib/useOffline";
import { useCachedQuery } from "../lib/useCachedQuery";
import { setCachedData } from "../lib/offlineCache";

/**
 * Component that runs in the background to pre-fetch and cache
 * all bookings data whenever the user is online.
 * This ensures all bookings and tickets are always cached for offline access.
 */
export default function BackgroundCache() {
  const isOffline = useOffline();
  
  // Check if user is authenticated (using cached query to avoid extra requests)
  const currentUser = useCachedQuery<any>(
    api.users.current,
    {},
    {
      cacheKey: "current_user",
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  // Fetch all bookings data using cached queries (automatically cached)
  const allBookings = useCachedQuery<any[]>(
    api.bookings.myBookings,
    currentUser ? {} : "skip",
    {
      cacheKey: "my_bookings_all",
      cacheTTL: 60 * 60 * 1000, // 1 hour
    }
  );
  
  const bookingsByEvent = useCachedQuery<Array<{
    event: any;
    bookings: any[];
  }>>(
    api.bookings.myBookingsByEvent,
    currentUser ? {} : "skip",
    {
      cacheKey: "my_bookings_by_event",
      cacheTTL: 60 * 60 * 1000, // 1 hour
    }
  );

  // Pre-fetch and cache all individual bookings and event bookings
  useEffect(() => {
    if (isOffline || !currentUser) return; // Don't pre-fetch when offline or not authenticated
    
    // Cache all individual bookings from myBookings query
    // This ensures View Full Details page can load them offline
    if (allBookings && allBookings.length > 0) {
      console.log(`[BackgroundCache] Pre-caching ${allBookings.length} individual bookings`);
      allBookings.forEach((booking) => {
        if (booking?._id) {
          const cacheKey = `booking-${booking._id}`;
          // Cache with same structure as getBooking query returns
          setCachedData(cacheKey, booking, 2 * 60 * 1000).catch((error) => {
            console.error(`[BackgroundCache] Failed to cache booking ${booking._id}:`, error);
          });
        }
      });
    }

    // Cache event bookings for each event (for View Tickets page)
    if (bookingsByEvent && bookingsByEvent.length > 0) {
      console.log(`[BackgroundCache] Pre-caching event bookings for ${bookingsByEvent.length} events`);
      bookingsByEvent.forEach(({ event, bookings }) => {
        if (event?._id && bookings?.length > 0) {
          const cacheKey = `event-bookings-${event._id}`;
          setCachedData(cacheKey, bookings, 2 * 60 * 1000).catch((error) => {
            console.error(`[BackgroundCache] Failed to cache event bookings for ${event._id}:`, error);
          });
        }
      });
    }
  }, [allBookings, bookingsByEvent, isOffline, currentUser]);

  const precacheUrls = useMemo(() => {
    const urls = new Set<string>();
    urls.add("/my-bookings");

    if (allBookings?.length) {
      allBookings.forEach((booking) => {
        if (booking?._id) {
          urls.add(`/bookings/${booking._id}`);
        }
      });
    }

    if (bookingsByEvent?.length) {
      bookingsByEvent.forEach(({ event }) => {
        if (event?._id) {
          urls.add(`/my-bookings/${event._id}`);
        }
      });
    }

    return Array.from(urls);
  }, [allBookings, bookingsByEvent]);

  const cachedUrlRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (isOffline || !currentUser) return;
    if (!precacheUrls.length) return;

    // Only send URLs that have not already been cached in this session
    const urlsToCache = precacheUrls.filter((url) => {
      return !cachedUrlRef.current.has(url);
    });

    if (urlsToCache.length === 0) return;

    navigator.serviceWorker.ready
      .then((registration) => {
        const worker = registration.active || registration.waiting;
        if (!worker) return;

        console.log(
          `[BackgroundCache] Requesting service worker to cache pages: ${urlsToCache.join(
            ", "
          )}`
        );

        worker.postMessage({
          type: "CACHE_URLS",
          urls: urlsToCache,
        });

        urlsToCache.forEach((url) => cachedUrlRef.current.add(url));
      })
      .catch((error) => {
        console.error("[BackgroundCache] Failed to precache pages:", error);
      });
  }, [precacheUrls, isOffline, currentUser]);

  // This component doesn't render anything
  return null;
}
