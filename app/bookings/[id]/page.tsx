"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import MainLayout from "../../components/MainLayout";
import WalletButtons from "../../components/WalletButtons";
import Link from "next/link";
import QRCode from "react-qr-code";
import { useParams } from "next/navigation";
import { useQrTokenGenerator } from "../../lib/qrTokenGenerator";

type QrData = {
  value: string;
  expiresAt: number;
  windowMs: number;
};

export default function BookingConfirmationPage() {
  const params = useParams<{ id: string }>();
  const idParam = Array.isArray(params?.id) ? params?.id[0] : params?.id;

  const bookingId = idParam ? (idParam as Id<"bookings">) : null;
  const booking = useQuery(
    api.bookings.getBooking,
    bookingId ? { bookingId } : "skip"
  );
  const currentUser = useQuery(api.users.current);
  const updateScanStatus = useMutation(api.bookings.setScannedStatus);
  const { generateTokens, isUsingLocalGeneration } = useQrTokenGenerator();

  const [qrQueue, setQrQueue] = useState<QrData[]>([]);
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [lastQrValue, setLastQrValue] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const fetchingRef = useRef(false);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const progressAnimationRef = useRef<number | null>(null);
  const previousBookingIdRef = useRef<Id<"bookings"> | null>(null);

  const isScanned = Boolean(booking?.scanned);
  const isValidated = Boolean(booking?.validated && !booking?.scanned);

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

  const missingBookingId = !bookingId;

  const requestTokens = useCallback(
    async (force = false) => {
      if (!bookingId) return;
      if (fetchingRef.current) return;
      if (booking === undefined || !booking) return;
      if (booking.scanned && !force) return;
      if (!booking.ticketId) return;

      fetchingRef.current = true;
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
          setQrQueue((prev) => {
            const filteredPrev = prev.filter(
              (token) => token.expiresAt > nowTime
            );
            const combined = [...filteredPrev];

            for (const token of tokens) {
              if (
                !combined.some((existing) => existing.value === token.value)
              ) {
                combined.push(token);
              }
            }

            combined.sort((a, b) => a.expiresAt - b.expiresAt);
            return combined.slice(0, 3);
          });
          setNow(Date.now());
        }

        setQrError(null);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to refresh QR code";
        setQrError(message);
      } finally {
        fetchingRef.current = false;
      }
    },
    [booking, bookingId, generateTokens]
  );

  // Reset QR data when booking ID changes
  useEffect(() => {
    if (booking === undefined) {
      return;
    }

    const currentBookingId = booking?._id;
    
    // Only reset QR data when booking ID actually changes
    if (currentBookingId && currentBookingId !== previousBookingIdRef.current) {
      previousBookingIdRef.current = currentBookingId;
      setQrQueue([]);
      setQrData(null);
      setQrError(null);
    }

    if (!currentBookingId || !booking) {
      return;
    }

    // Reset if booking is scanned
    if (booking.scanned) {
      setQrQueue([]);
      setQrData(null);
      setQrError(null);
    }
  }, [booking?._id, booking?.scanned]);

  // Update now timestamp independently
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const node = progressRef.current;

    if (progressAnimationRef.current !== null) {
      cancelAnimationFrame(progressAnimationRef.current);
      progressAnimationRef.current = null;
    }

    if (!node) {
      return;
    }

    if (!qrData || isScanned) {
      node.style.setProperty("--progress", "0");
      return;
    }

    const totalDuration = qrData.windowMs;
    if (!totalDuration) {
      node.style.setProperty("--progress", "0");
      return;
    }

    const end = qrData.expiresAt;

    const tick = () => {
      const remaining = Math.max(0, end - Date.now());
      const progress = Math.min(
        1,
        Math.max(0, totalDuration > 0 ? remaining / totalDuration : 0)
      );
      node.style.setProperty("--progress", progress.toString());

      if (remaining > 0 && !isScanned) {
        progressAnimationRef.current = requestAnimationFrame(tick);
      } else {
        if (progressAnimationRef.current !== null) {
          cancelAnimationFrame(progressAnimationRef.current);
          progressAnimationRef.current = null;
        }
        node.style.setProperty("--progress", "0");
      }
    };

    node.style.setProperty("--progress", "1");
    progressAnimationRef.current = requestAnimationFrame(tick);

    return () => {
      if (progressAnimationRef.current !== null) {
        cancelAnimationFrame(progressAnimationRef.current);
        progressAnimationRef.current = null;
      }
    };
  }, [qrData, isScanned]);

  useEffect(() => {
    if (!qrQueue.length) {
      if (qrData !== null) {
        setQrData(null);
      }
      return;
    }

    const nowTime = now;
    const validQueue = qrQueue.filter((token) => token.expiresAt > nowTime);
    if (validQueue.length !== qrQueue.length) {
      setQrQueue(validQueue);
      return;
    }

    const activeToken = validQueue[0];
    if (!activeToken) {
      if (qrData !== null) {
        setQrData(null);
      }
      return;
    }

    if (!qrData || qrData.value !== activeToken.value) {
      setQrData(activeToken);
      setLastQrValue(activeToken.value);
    }
  }, [qrQueue, now, qrData]);

  // Request tokens when needed
  useEffect(() => {
    if (booking === undefined || !booking || booking.scanned) {
      return;
    }

    if (!booking.ticketId) {
      return;
    }

    if (qrError) {
      return;
    }

    if (fetchingRef.current) return;

    if (qrQueue.length <= 1) {
      requestTokens();
    }
  }, [booking?._id, booking?.scanned, booking?.ticketId, qrQueue.length, qrError, requestTokens]);

  if (booking === undefined) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-800 rounded w-1/3"></div>
          <div className="h-96 bg-slate-800 rounded"></div>
        </div>
      </MainLayout>
    );
  }

  if (!booking) {
    return (
      <MainLayout>
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-10 py-16 text-center text-red-100 shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-3xl">
            ❌
          </div>
          <h3 className="mt-6 text-2xl font-semibold">Booking Not Found</h3>
          <p className="mt-3 text-sm text-red-100/80">
            The booking you&apos;re looking for doesn&apos;t exist
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.36)]"
          >
            Back to Events
          </Link>
        </div>
      </MainLayout>
    );
  }

  const scannedAt = booking.scannedAt
    ? new Date(booking.scannedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const refreshSeconds = qrData && !isScanned ? qrData.windowMs / 1000 : null;
  const remainingSeconds =
    qrData && !isScanned ? Math.max(0, (qrData.expiresAt - now) / 1000) : null;

  const progressPercent =
    remainingSeconds !== null && refreshSeconds !== null && refreshSeconds > 0
      ? Math.max(0, Math.min(100, (remainingSeconds / refreshSeconds) * 100))
      : null;
  const remainingSecondsDisplay =
    remainingSeconds !== null ? Math.ceil(remainingSeconds) : null;

  const canManageScan =
    !!currentUser &&
    (currentUser.role === "admin" ||
      currentUser.role === "superadmin" ||
      (booking.event && booking.event.createdBy === currentUser._id));

  const handleScanUpdate = async (nextState: boolean) => {
    if (!bookingId) return;
    try {
      await updateScanStatus({ bookingId, scanned: nextState });
      if (nextState) {
        setQrData(null);
        setQrQueue([]);
      } else {
        setQrError(null);
        await requestTokens(true);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update ticket status";
      alert(message);
    }
  };

  if (missingBookingId) {
    return (
      <MainLayout>
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-10 py-16 text-center text-red-100 shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-3xl">
            ❌
          </div>
          <h3 className="mt-6 text-2xl font-semibold">Booking ID Missing</h3>
          <p className="mt-3 text-sm text-red-100/80">
            Please use a valid booking link to view details.
          </p>
          <Link
            href="/my-bookings"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.36)]"
          >
            View My Bookings
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-50 mb-2">
              Your Ticket
            </h1>
            <p className="text-slate-400">
              Booking reference:{" "}
              <span className="font-mono text-slate-300">{booking._id}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                booking.status === "confirmed"
                  ? "bg-green-500/20 text-green-200 border border-green-500/30"
                  : booking.status === "cancelled"
                    ? "bg-red-500/20 text-red-200 border border-red-500/30"
                    : "bg-yellow-500/20 text-yellow-200 border border-yellow-500/30"
              }`}
            >
              {booking.status.toUpperCase()}
            </span>
            {booking.paymentStatus && (
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  booking.paymentStatus === "completed"
                    ? "bg-green-500/20 text-green-200 border border-green-500/30"
                    : booking.paymentStatus === "failed"
                      ? "bg-red-500/20 text-red-200 border border-red-500/30"
                      : "bg-yellow-500/20 text-yellow-200 border border-yellow-500/30"
                }`}
              >
                Payment: {booking.paymentStatus.toUpperCase()}
              </span>
            )}
            {isValidated && (
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-orange-500/20 text-orange-200 border border-orange-500/30">
                VALIDATED
              </span>
            )}
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                isScanned
                  ? "bg-red-500/20 text-red-200 border border-red-500/30"
                  : "bg-sky-500/20 text-sky-200 border border-sky-500/30"
              }`}
            >
              {isScanned ? "ENTERED" : "ACTIVE"}
            </span>
          </div>
        </div>

        {/* Main Ticket Card */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-800/90 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Event Image Header */}
          {booking.event?.imageUrl && (
            <div className="relative h-64 overflow-hidden">
              <img
                src={booking.event.imageUrl}
                alt={booking.event.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                  {booking.event.name}
                </h2>
                <p className="text-slate-200 text-lg drop-shadow-md">
                  {booking.event.description}
                </p>
              </div>
            </div>
          )}

          <div className="p-8">
            {/* QR Code and Ticket Info Section */}
            <div className="grid gap-8 lg:grid-cols-2 mb-8">
              {/* QR Code Section */}
              <div className="flex flex-col items-center justify-center">
                {isScanned ? (
                  <div className="w-full rounded-2xl border border-red-500/30 bg-red-500/20 px-8 py-10 text-center">
                    <div className="text-5xl mb-4">❌</div>
                    <p className="text-xl font-semibold text-red-200 mb-2">
                      Ticket Already Used
                    </p>
                    {scannedAt && (
                      <p className="text-sm text-red-300 mb-6">
                        Scanned on {scannedAt}
                      </p>
                    )}
                    {lastQrValue && (
                      <div className="mt-6 flex flex-col items-center gap-3">
                        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-inner">
                          <div
                            style={{ filter: "grayscale(1)", opacity: 0.55 }}
                          >
                            <QRCode
                              value={lastQrValue}
                              size={200}
                              bgColor="#1e293b"
                              fgColor="#94a3b8"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">
                          Preview only – no longer valid for entry
                        </p>
                      </div>
                    )}
                  </div>
                ) : qrError ? (
                  <div className="w-full rounded-2xl border border-red-500/30 bg-red-500/20 px-8 py-10 text-center">
                    <p className="text-xl font-semibold text-red-200 mb-4">
                      {qrError}
                    </p>
                    <button
                      onClick={() => requestTokens()}
                      className="inline-flex items-center justify-center rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                    >
                      Try Again
                    </button>
                  </div>
                ) : !qrData || !qrData.value ? (
                  <div className="flex h-64 w-full items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-400/30 border-t-indigo-400"></div>
                  </div>
                ) : (
                  <div className="relative inline-flex flex-col items-center">
                    {isValidated && (
                      <div className="mb-4 rounded-lg bg-orange-500/10 border border-orange-500/30 px-6 py-3">
                        <p className="text-base font-semibold text-orange-200 text-center">
                          ✓ Ticket Validated - Ready for Entry
                        </p>
                      </div>
                    )}
                    <div
                      ref={progressRef}
                      className={`qr-progress ${isValidated ? 'validated' : ''} relative inline-flex items-center justify-center rounded-3xl p-4 transition-all duration-200`}
                    >
                      <div className="rounded-2xl bg-white p-4 shadow-inner">
                        <QRCode value={qrData.value} size={220} />
                      </div>
                    </div>
                    <p className="mt-6 text-center text-sm font-medium text-slate-300 max-w-sm">
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

                    {/* Wallet Button */}
                    {qrData && qrData.value && !isScanned && (
                      <div className="mt-8 w-full">
                        <WalletButtons
                          bookingId={booking._id}
                          eventId={booking.event?._id}
                          eventName={booking.event?.name}
                          eventDate={booking.event?.date}
                          eventLocation={
                            booking.event
                              ? `${booking.event.location}, ${booking.event.city}`
                              : undefined
                          }
                          ticketName={booking.ticket?.name}
                          customerName={booking.customerName}
                          qrValue={qrData.value}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Ticket Details Sidebar */}
              <div className="space-y-6">
                {/* Quick Info Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Ticket Type
                    </div>
                    <div className="text-lg font-bold text-slate-50">
                      {booking.ticket?.name}
                    </div>
                    {booking.ticket?.description && (
                      <div className="text-sm text-slate-400 mt-1">
                        {booking.ticket.description}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Quantity
                    </div>
                    <div className="text-3xl font-bold text-indigo-400">
                      {booking.quantity}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {booking.quantity === 1 ? "ticket" : "tickets"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Total Price
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {formatPrice(booking.totalPrice)}
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                {booking.event && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Event Date
                      </div>
                      <div className="text-base font-semibold text-slate-50">
                        {booking.event.date && formatDate(booking.event.date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Location
                      </div>
                      <div className="text-base font-semibold text-slate-50">
                        {booking.event.location}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        {booking.event.city}, {booking.event.country}
                      </div>
                    </div>
                    <Link
                      href={`/events/${booking.event._id}`}
                      className="block w-full text-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                    >
                      View Event Details
                    </Link>
                  </div>
                )}

                {/* Gate Control (Admin) */}
                {canManageScan && (
                  <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-300 mb-3">
                      Gate Control
                    </h3>
                    <p className="text-sm text-indigo-200/80 mb-4">
                      {isScanned
                        ? "This ticket is marked as used. Reset only if the scan was a mistake."
                        : "Mark the ticket as used immediately after scanning at the gate."}
                    </p>
                    {isScanned ? (
                      <button
                        onClick={() => handleScanUpdate(false)}
                        className="w-full rounded-xl border border-indigo-400/50 bg-indigo-500/20 px-5 py-3 text-center text-sm font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/30"
                      >
                        Reset Ticket
                      </button>
                    ) : (
                      <button
                        onClick={() => handleScanUpdate(true)}
                        className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                      >
                        Mark as Used
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Information */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
            <h3 className="text-lg font-bold text-slate-50 mb-4">
              Customer Information
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Name
                </div>
                <div className="text-base font-semibold text-slate-100">
                  {booking.customerName}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Email
                </div>
                <div className="text-base font-semibold text-slate-100">
                  {booking.customerEmail}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Booking Date
                </div>
                <div className="text-base font-semibold text-slate-100">
                  {formatBookingDate(booking.bookingDate)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
            <h3 className="text-lg font-bold text-slate-50 mb-4">
              Payment Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-slate-300">
                  Tickets ({booking.quantity})
                </span>
                <span className="font-semibold text-slate-100">
                  {formatPrice(booking.totalPrice)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-slate-50">
                  Total Paid
                </span>
                <span className="text-2xl font-bold text-green-400">
                  {formatPrice(booking.totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/my-bookings"
            className="flex-1 text-center rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
          >
            View All Bookings
          </Link>
          {booking.event && (
            <Link
              href={`/events/${booking.event._id}`}
              className="flex-1 text-center rounded-xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.36)]"
            >
              View Event
            </Link>
          )}
        </div>

        {/* Important Notice */}
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-6">
          <div className="flex items-start gap-4">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="text-sm font-bold text-sky-200 mb-1">
                Important Information
              </h4>
              <p className="text-sm text-sky-200/80">
                Please bring a valid ID and this booking reference to the event.
                You can access your booking details anytime from your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
