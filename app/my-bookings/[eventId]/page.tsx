"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import MainLayout from "../../components/MainLayout";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { ArrowLeft, Calendar, MapPin, Ticket } from "lucide-react";
import { useQrTokenGenerator } from "../../lib/qrTokenGenerator";
import { useCachedQuery } from "../../lib/useCachedQuery";
import { useOffline } from "../../lib/useOffline";

type QrData = {
  value: string;
  expiresAt: number;
  windowMs: number;
};

export default function EventTicketsPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventIdParam = Array.isArray(params?.eventId)
    ? params?.eventId[0]
    : params?.eventId;
  const eventId = eventIdParam ? (eventIdParam as Id<"events">) : null;
  const isOffline = useOffline();

  const currentUser = useCachedQuery<any>(
    api.users.current,
    {},
    {
      cacheKey: "current_user",
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    }
  );
  const eventBookings = useCachedQuery<any>(
    api.bookings.getBookingsByEvent,
    eventId ? { eventId } : "skip",
    {
      cacheKey: eventId ? `event-bookings-${eventId}` : "skip",
      cacheTTL: 2 * 60 * 1000, // 2 minutes
    }
  );
  const event =
    eventBookings && eventBookings.length > 0 ? eventBookings[0].event : null;
  const { generateTokens, isUsingLocalGeneration } = useQrTokenGenerator();

  const [qrDataMap, setQrDataMap] = useState<Map<string, QrData>>(new Map());
  const [qrQueues, setQrQueues] = useState<Map<string, QrData[]>>(new Map());
  const [now, setNow] = useState(Date.now());
  const fetchingRefs = useRef<Map<string, boolean>>(new Map());
  const [qrErrors, setQrErrors] = useState<Map<string, string>>(new Map());
  const progressRefs = useRef<Map<Id<"bookings">, HTMLDivElement | null>>(
    new Map()
  );
  const progressAnimationRefs = useRef<Map<Id<"bookings">, number>>(new Map());

  // Load cached QR data from sessionStorage on mount
  useEffect(() => {
    if (!eventBookings) return;
    
    eventBookings.forEach((booking) => {
      try {
        const cacheKey = `qr_cache_${booking._id}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached) as QrData;
          // Only use cached data if it hasn't expired
          if (cachedData.expiresAt > Date.now()) {
            setQrDataMap((prev) => {
              const newMap = new Map(prev);
              newMap.set(booking._id, cachedData);
              return newMap;
            });
            setQrQueues((prev) => {
              const newMap = new Map(prev);
              newMap.set(booking._id, [cachedData]);
              return newMap;
            });
          }
        }
      } catch (error) {
        console.error(`Failed to load cached QR data for booking ${booking._id}:`, error);
      }
    });
  }, [eventBookings]);

  // Save QR data to sessionStorage when it changes
  useEffect(() => {
    if (!qrDataMap.size) return;
    
    qrDataMap.forEach((qrData, bookingId) => {
      try {
        const cacheKey = `qr_cache_${bookingId}`;
        sessionStorage.setItem(cacheKey, JSON.stringify(qrData));
      } catch (error) {
        console.error(`Failed to cache QR data for booking ${bookingId}:`, error);
      }
    });
  }, [qrDataMap]);

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatBookingDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const requestTokens = useCallback(
    async (bookingId: Id<"bookings">, force = false) => {
      if (fetchingRefs.current.get(bookingId)) return;
      const booking = eventBookings?.find((b) => b._id === bookingId);
      if (!booking || booking.scanned) return;
      if (!booking.ticketId) return;

      fetchingRefs.current.set(bookingId, true);
      try {
        const result = await generateTokens(bookingId, booking.ticketId);
        const nowTime = Date.now();
        const tokens = Array.isArray(result.tokens)
          ? result.tokens
              .map((token) => ({
                value: token.qrValue,
                expiresAt: token.expiresAt,
                windowMs: result.windowMs,
              }))
              .filter((token) => token.expiresAt > nowTime)
          : [];

        if (tokens.length > 0) {
          setQrQueues((prev) => {
            const newMap = new Map(prev);
            const existingQueue = newMap.get(bookingId) || [];
            const filtered = existingQueue.filter(
              (token) => token.expiresAt > nowTime
            );
            const combined = [...filtered];

            for (const token of tokens) {
              if (
                !combined.some((existing) => existing.value === token.value)
              ) {
                combined.push(token);
              }
            }

            combined.sort((a, b) => a.expiresAt - b.expiresAt);
            newMap.set(bookingId, combined.slice(0, 3));
            return newMap;
          });
          setNow(Date.now());
        }

        setQrErrors((prev) => {
          const newMap = new Map(prev);
          newMap.delete(bookingId);
          return newMap;
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to refresh QR code";
        setQrErrors((prev) => {
          const newMap = new Map(prev);
          newMap.set(bookingId, message);
          return newMap;
        });
      } finally {
        fetchingRefs.current.set(bookingId, false);
      }
    },
    [eventBookings, generateTokens]
  );

  // Initialize QR tokens for all bookings
  useEffect(() => {
    if (!eventBookings) return;

    eventBookings.forEach((booking) => {
      if (!booking.scanned) {
        requestTokens(booking._id);
      }
    });
  }, [eventBookings, requestTokens]);

  // Update now timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update active QR codes from queues
  useEffect(() => {
    if (!qrQueues.size) return;

    const nowTime = now;
    qrQueues.forEach((queue, bookingId) => {
      const validQueue = queue.filter((token) => token.expiresAt > nowTime);
      if (validQueue.length !== queue.length) {
        setQrQueues((prev) => {
          const newMap = new Map(prev);
          newMap.set(bookingId, validQueue);
          return newMap;
        });
        return;
      }

      const activeToken = validQueue[0];
      if (activeToken) {
        setQrDataMap((prev) => {
          const existing = prev.get(bookingId);
          if (existing && existing.value === activeToken.value) {
            return prev;
          }
          const newMap = new Map(prev);
          newMap.set(bookingId, activeToken);
          return newMap;
        });
      } else {
        setQrDataMap((prev) => {
          if (!prev.has(bookingId)) {
            return prev;
          }
          const newMap = new Map(prev);
          newMap.delete(bookingId);
          return newMap;
        });
      }
    });
  }, [qrQueues, now]);

  // Request more tokens when queues are low
  useEffect(() => {
    if (!eventBookings) return;

    eventBookings.forEach((booking) => {
      if (booking.scanned) return;
      const queue = qrQueues.get(booking._id) || [];
      const qrData = qrDataMap.get(booking._id);
      
      // If offline and we have cached QR data, don't try to generate new tokens
      if (isOffline && qrData) {
        return;
      }
      
      if (queue.length <= 1 && !fetchingRefs.current.get(booking._id)) {
        requestTokens(booking._id);
      }
    });
  }, [eventBookings, qrQueues, qrDataMap, requestTokens, isOffline]);

  useEffect(() => {
    if (!eventBookings) return;

    const frames = progressAnimationRefs.current;
    const refs = progressRefs.current;

    const cancelFrame = (bookingId: Id<"bookings">) => {
      const frameId = frames.get(bookingId);
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
        frames.delete(bookingId);
      }
    };

    const activeIds = new Set<Id<"bookings">>();

    eventBookings.forEach((booking) => {
      const bookingId = booking._id;
      const node = refs.get(bookingId);
      const qrData = qrDataMap.get(bookingId);
      const isScanned = Boolean(booking.scanned);

      if (!node) {
        cancelFrame(bookingId);
        return;
      }

      if (!qrData || isScanned) {
        cancelFrame(bookingId);
        node.style.setProperty("--progress", "0");
        return;
      }

      const totalDuration = qrData.windowMs;
      if (!totalDuration) {
        cancelFrame(bookingId);
        node.style.setProperty("--progress", "0");
        return;
      }

      const end = qrData.expiresAt;

      cancelFrame(bookingId);

      const tick = () => {
        const remaining = Math.max(0, end - Date.now());
        const progress = Math.min(
          1,
          Math.max(0, totalDuration > 0 ? remaining / totalDuration : 0)
        );
        node.style.setProperty("--progress", progress.toString());

        if (remaining > 0 && !booking.scanned) {
          const frameId = requestAnimationFrame(tick);
          frames.set(bookingId, frameId);
        } else {
          frames.delete(bookingId);
          node.style.setProperty("--progress", "0");
        }
      };

      node.style.setProperty("--progress", "1");
      const frameId = requestAnimationFrame(tick);
      frames.set(bookingId, frameId);
      activeIds.add(bookingId);
    });

    frames.forEach((frameId, bookingId) => {
      if (!refs.has(bookingId) || !activeIds.has(bookingId)) {
        cancelAnimationFrame(frameId);
        frames.delete(bookingId);
      }
    });

    return () => {
      frames.forEach((frameId, bookingId) => {
        cancelAnimationFrame(frameId);
        frames.delete(bookingId);
      });
    };
  }, [eventBookings, qrDataMap]);

  if (currentUser === undefined || eventBookings === undefined) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-800 rounded w-1/4"></div>
          <div className="h-96 bg-slate-800 rounded"></div>
        </div>
      </MainLayout>
    );
  }

  if (!currentUser) {
    return (
      <MainLayout>
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-10 py-16 text-center text-red-100 shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-3xl">
            🔒
          </div>
          <h3 className="mt-6 text-2xl font-semibold">Sign In Required</h3>
          <p className="mt-3 text-sm text-red-100/80">
            Please sign in to view your tickets
          </p>
        </div>
      </MainLayout>
    );
  }

  if (!eventId || !event) {
    return (
      <MainLayout>
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-10 py-16 text-center text-red-100 shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-3xl">
            ❌
          </div>
          <h3 className="mt-6 text-2xl font-semibold">Event Not Found</h3>
          <p className="mt-3 text-sm text-red-100/80">
            The event you&apos;re looking for doesn&apos;t exist
          </p>
          <Link
            href="/my-bookings"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.36)]"
          >
            Back to My Bookings
          </Link>
        </div>
      </MainLayout>
    );
  }

  if (eventBookings.length === 0) {
    return (
      <MainLayout>
        <div className="rounded-3xl border border-white/10 bg-white/5 px-10 py-16 text-center text-slate-100 shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl">
            🎟️
          </div>
          <h3 className="mt-6 text-2xl font-semibold">No Tickets Found</h3>
          <p className="mt-3 text-sm text-slate-300/80">
            You don&apos;t have any tickets for this event
          </p>
          <Link
            href="/my-bookings"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.36)]"
          >
            Back to My Bookings
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Offline Indicator */}
      {isOffline && eventBookings && eventBookings.length > 0 && (
        <div className="mb-6 rounded-xl border border-orange-500/20 bg-orange-500/10 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📱</div>
            <div>
              <h3 className="text-sm font-semibold text-orange-100">
                Showing Cached Tickets
              </h3>
              <p className="mt-1 text-xs text-orange-100/80">
                You&apos;re offline. Displaying your last downloaded tickets. Connect to the internet to refresh.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-slate-400 transition hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Back to My Bookings
        </button>

        {/* Event Header */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-slate-900/80 overflow-hidden">
          {event.imageUrl && (
            <div className="relative h-64 overflow-hidden">
              <img
                src={event.imageUrl}
                alt={event.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-transparent" />
            </div>
          )}
          <div className="p-6">
            <h1 className="text-3xl font-bold text-slate-50 mb-4">
              {event.name}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Calendar
                  className="h-5 w-5 text-slate-400"
                  strokeWidth={1.8}
                />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-slate-400" strokeWidth={1.8} />
                <span>
                  {event.location}, {event.city}, {event.country}
                </span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-50 mb-6">Your Tickets</h2>
      </div>

      {/* Tickets Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {eventBookings.map((booking) => {
          const qrData = qrDataMap.get(booking._id);
          const qrError = qrErrors.get(booking._id);
          const isScanned = Boolean(booking.scanned);
          const isValidated = Boolean(booking.validated && !booking.scanned);

          const refreshSeconds =
            qrData && !isScanned ? qrData.windowMs / 1000 : null;
          const remainingSeconds =
            qrData && !isScanned
              ? Math.max(0, (qrData.expiresAt - now) / 1000)
              : null;

          const progressPercent =
            remainingSeconds !== null &&
            refreshSeconds !== null &&
            refreshSeconds > 0
              ? Math.max(
                  0,
                  Math.min(100, (remainingSeconds / refreshSeconds) * 100)
                )
              : null;
          const remainingSecondsDisplay =
            remainingSeconds !== null ? Math.ceil(remainingSeconds) : null;

          const handleProgressRef = (node: HTMLDivElement | null) => {
            if (node) {
              progressRefs.current.set(booking._id, node);
            } else {
              progressRefs.current.delete(booking._id);
            }
          };

          return (
            <div
              key={booking._id}
              className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 animate-fade-up"
            >
              {/* Ticket Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-50 mb-2">
                      {booking.ticket?.name}
                    </h3>
                    <p className="text-sm text-slate-400 mb-3">
                      {booking.ticket?.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-slate-300">
                      <span>Quantity: {booking.quantity}</span>
                      <span>•</span>
                      <span className="font-semibold text-white">
                        {formatPrice(booking.totalPrice)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        booking.status === "confirmed"
                          ? "bg-green-500/20 text-green-200"
                          : booking.status === "cancelled"
                            ? "bg-red-500/20 text-red-200"
                            : "bg-yellow-500/20 text-yellow-200"
                      }`}
                    >
                      {booking.status}
                    </span>
                    {isValidated && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-200">
                        Validated
                      </span>
                    )}
                    {isScanned && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-200">
                        Entered
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-400 border-t border-white/10 pt-4">
                  Booked: {formatBookingDate(booking.bookingDate)}
                </div>
              </div>

              {/* QR Code Section */}
              <div className="flex flex-col items-center">
                {isScanned ? (
                  <div className="w-full rounded-xl border border-red-500/30 bg-red-500/20 p-6 text-center">
                    <p className="text-lg font-semibold text-red-200 mb-4">
                      This ticket has already been used
                    </p>
                    {qrData && (
                      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                        <div style={{ filter: "grayscale(1)", opacity: 0.55 }}>
                          <QRCode
                            value={qrData.value}
                            size={192}
                            bgColor="#1e293b"
                            fgColor="#94a3b8"
                          />
                        </div>
                      </div>
                    )}
                    <p className="mt-4 text-xs text-red-300">
                      This QR code is no longer valid for entry
                    </p>
                  </div>
                ) : qrError ? (
                  <div className="w-full rounded-xl border border-red-500/30 bg-red-500/20 p-6 text-center">
                    <p className="text-lg font-semibold text-red-200 mb-4">
                      {qrError}
                    </p>
                    <button
                      onClick={() => requestTokens(booking._id, true)}
                      className="rounded-xl border border-red-400/50 bg-red-600/20 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-600/30"
                    >
                      Try Again
                    </button>
                  </div>
                ) : !qrData ? (
                  <div className="flex h-48 w-full flex-col items-center justify-center gap-3">
                    {typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine ? (
                      <>
                        <div className="text-3xl">📡</div>
                        <p className="text-sm font-semibold text-slate-300">
                          Offline Mode
                        </p>
                        <p className="text-xs text-slate-400 text-center max-w-xs">
                          {isUsingLocalGeneration 
                            ? "Please wait for booking details to load, or check your connection."
                            : "QR codes require an internet connection. Please check your connection and try again."}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-400/30 border-t-indigo-400"></div>
                        <p className="text-xs text-slate-400">
                          Generating QR code...
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="relative inline-flex flex-col items-center rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                    {isValidated && (
                      <div className="mb-3 rounded-lg bg-orange-500/10 border border-orange-500/30 px-4 py-2">
                        <p className="text-sm font-semibold text-orange-200 text-center">
                          ✓ Ticket Validated - Ready for Entry
                        </p>
                      </div>
                    )}
                    <div
                      ref={handleProgressRef}
                      className={`qr-progress ${isValidated ? 'validated' : ''} relative inline-flex items-center justify-center rounded-2xl p-3 transition-all duration-200`}
                    >
                      <div className="rounded-xl bg-white p-3 shadow-inner">
                        <QRCode value={qrData.value} size={192} />
                      </div>
                    </div>
                    <p className="mt-4 text-center text-sm text-slate-400">
                      {isValidated 
                        ? "Present this code for entry"
                        : "Present this QR code at the entrance"}
                    </p>
                    {remainingSecondsDisplay !== null &&
                      refreshSeconds !== null && (
                        <p className="mt-2 text-center text-xs text-slate-500">
                          Valid for {remainingSecondsDisplay}s · Refreshes every{" "}
                          {refreshSeconds}s
                        </p>
                      )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3 pt-6 border-t border-white/10">
                <Link
                  href={`/bookings/${booking._id}`}
                  className="flex-1 text-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10"
                >
                  View Full Details
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
}
