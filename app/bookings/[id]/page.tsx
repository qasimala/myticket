"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import MainLayout from "../../components/MainLayout";
import Link from "next/link";
import QRCode from "react-qr-code";
import { useParams } from "next/navigation";

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
  const generateQrToken = useAction(api.bookings.generateQrToken);

  const [qrQueue, setQrQueue] = useState<QrData[]>([]);
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [lastQrValue, setLastQrValue] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const fetchingRef = useRef(false);

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

      fetchingRef.current = true;
      try {
        const result = await generateQrToken({ bookingId });
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
              if (!combined.some((existing) => existing.value === token.value)) {
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
    [booking, bookingId, generateQrToken]
  );

  useEffect(() => {
    if (booking === undefined) {
      return;
    }

    setQrQueue([]);
    setQrData(null);

    if (booking && !booking.scanned) {
      requestTokens();
    } else {
      setQrError(null);
    }
  }, [booking, requestTokens]);

  useEffect(() => {
    if (!qrData || booking?.scanned) {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000 / 30);

    return () => clearInterval(interval);
  }, [qrData, booking?.scanned]);

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

  useEffect(() => {
    if (booking === undefined || !booking || booking.scanned) {
      return;
    }

    if (qrError) {
      return;
    }

    if (fetchingRef.current) return;

    if (qrQueue.length <= 1) {
      requestTokens();
    }
  }, [booking, qrQueue, qrError, requestTokens]);

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

  const isScanned = Boolean(booking.scanned);
  const scannedAt = booking.scannedAt
    ? new Date(booking.scannedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

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
      ? Math.max(0, Math.min(100, (remainingSeconds / refreshSeconds) * 100))
      : null;
  const gradientDegrees =
    progressPercent !== null ? (progressPercent / 100) * 360 : null;
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
      <div className="mx-auto w-full">
        {/* Success Message */}
        <div className="border-2 border-green-500/30 bg-green-500/20 rounded-2xl p-8 text-center mb-6">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-slate-300">
            Your tickets have been successfully booked. A confirmation email
            has been sent to <strong>{booking.customerEmail}</strong>
          </p>
        </div>

        {/* Digital Ticket */}
        <div className="mb-6 rounded-xl border border-white/10 bg-slate-900/80 shadow-lg p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex-1 flex flex-col items-center">
              {isScanned ? (
                <div className="w-full rounded-lg border border-red-500/30 bg-red-500/20 px-6 py-5 text-center">
                  <p className="text-lg font-semibold text-red-200">
                    This ticket has already been used.
                  </p>
                  {scannedAt && (
                    <p className="mt-2 text-sm text-red-300">
                      Marked as scanned on {scannedAt}.
                    </p>
                  )}
                  {lastQrValue ? (
                    <div className="mt-4 flex flex-col items-center gap-3">
                      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-inner">
                        <div style={{ filter: "grayscale(1)", opacity: 0.55 }}>
                          <QRCode value={lastQrValue} size={192} bgColor="#1e293b" fgColor="#94a3b8" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">
                        Preview only – this code is no longer valid for entry.
                      </p>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-slate-500">
                      No QR preview available for this scanned ticket.
                    </p>
                  )}
                  <p className="mt-3 text-sm text-red-400">
                    The QR code is no longer valid for entry.
                  </p>
                </div>
              ) : qrError ? (
                <div className="w-full rounded-lg border border-red-500/30 bg-red-500/20 px-6 py-5 text-center">
                  <p className="text-lg font-semibold text-red-200">
                    {qrError}
                  </p>
                  <button
                    onClick={() => requestTokens()}
                    className="mt-4 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : !qrData ? (
                <div className="flex h-48 w-full items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-400/30 border-t-indigo-400"></div>
                </div>
              ) : (
                <div className="relative inline-flex flex-col items-center rounded-xl border border-slate-700 bg-slate-800/50 p-6 shadow-sm">
                  <div
                    className="relative inline-flex items-center justify-center rounded-2xl p-3 transition-all duration-200"
                    style={
                      gradientDegrees !== null
                        ? {
                            background: `conic-gradient(#4f46e5 ${gradientDegrees}deg, rgba(79,70,229,0.1) ${gradientDegrees}deg 360deg)`,
                          }
                        : undefined
                    }
                  >
                    <div className="rounded-xl bg-white p-3 shadow-inner">
                      <QRCode value={qrData.value} size={192} />
                    </div>
                    {progressPercent !== null && (
                      <span className="absolute -top-2 right-2 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-500"></span>
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-center text-sm text-slate-400">
                    Present this animated QR code at the entrance. Screenshots
                    expire quickly.
                  </p>
                  {remainingSecondsDisplay !== null && refreshSeconds !== null && (
                    <p className="mt-2 text-center text-xs text-slate-500">
                      Valid for {remainingSecondsDisplay}s · Refreshes every{" "}
                      {refreshSeconds}s
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Ticket Details
                </h3>
                <div className="mt-3 space-y-1 text-sm text-slate-300">
                  <p>
                    <span className="font-medium text-slate-100">Booking ID:</span>{" "}
                    <span className="font-mono break-all">{booking._id}</span>
                  </p>
                  <p>
                    <span className="font-medium text-slate-100">Ticket Type:</span>{" "}
                    {booking.ticket?.name}
                  </p>
                  <p>
                    <span className="font-medium text-slate-100">Quantity:</span>{" "}
                    {booking.quantity}
                  </p>
                  <p>
                    <span className="font-medium text-slate-100">Scan Status:</span>{" "}
                    {isScanned ? "Used" : "Active"}
                  </p>
                  {scannedAt && (
                    <p>
                      <span className="font-medium text-slate-100">Scanned At:</span>{" "}
                      {scannedAt}
                    </p>
                  )}
                </div>
              </div>

              {canManageScan && (
                <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/20 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-300">
                    Gate Control
                  </h3>
                  <p className="mt-2 text-sm text-indigo-300/80">
                    {isScanned
                      ? "This ticket is marked as used. Reset only if the scan was a mistake."
                      : "Mark the ticket as used immediately after scanning at the gate."}
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    {isScanned ? (
                      <button
                        onClick={() => handleScanUpdate(false)}
                        className="w-full rounded-lg border border-indigo-400 px-5 py-3 text-center font-semibold text-indigo-300 transition-colors hover:bg-indigo-400/20"
                      >
                        Reset Ticket
                      </button>
                    ) : (
                      <button
                        onClick={() => handleScanUpdate(true)}
                        className="w-full rounded-lg bg-indigo-600 px-5 py-3 text-center font-semibold text-white transition-colors hover:bg-indigo-700"
                      >
                        Mark as Used
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="border border-white/10 rounded-2xl bg-slate-900/80 shadow-lg overflow-hidden">
          {/* Event Image */}
          {booking.event?.imageUrl && (
            <img
              src={booking.event.imageUrl}
              alt={booking.event.name}
              className="w-full h-48 object-cover"
            />
          )}

          <div className="p-8">
            {/* Booking Reference */}
            <div className="mb-6 pb-6 border-b border-white/10">
              <div className="text-sm text-slate-400 mb-1">Booking Reference</div>
              <div className="text-lg font-mono font-bold text-slate-50">
                {booking._id}
              </div>
            </div>

            {/* Event Details */}
            <div className="mb-6 pb-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-slate-50 mb-4">
                {booking.event?.name}
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📅</span>
                  <div>
                    <div className="font-semibold text-slate-100">Date & Time</div>
                    <div className="text-slate-300">
                      {booking.event?.date && formatDate(booking.event.date)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <div className="font-semibold text-slate-100">Location</div>
                    <div className="text-slate-300">
                      {booking.event?.location}
                    </div>
                    <div className="text-sm text-slate-400">
                      {booking.event?.city}, {booking.event?.country}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="mb-6 pb-6 border-b border-white/10">
              <h3 className="text-lg font-bold text-slate-50 mb-3">
                Ticket Information
              </h3>
              
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-slate-100">
                      {booking.ticket?.name}
                    </div>
                    <div className="text-sm text-slate-300">
                      {booking.ticket?.description}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-100">
                      × {booking.quantity}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="mb-6 pb-6 border-b border-white/10">
              <h3 className="text-lg font-bold text-slate-50 mb-3">
                Customer Information
              </h3>
              
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-slate-400">Name:</span>{" "}
                  <span className="font-medium text-slate-100">
                    {booking.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Email:</span>{" "}
                  <span className="font-medium text-slate-100">
                    {booking.customerEmail}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Booking Date:</span>{" "}
                  <span className="font-medium text-slate-100">
                    {formatBookingDate(booking.bookingDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-50 mb-3">
                Payment Summary
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Tickets ({booking.quantity})</span>
                  <span>{formatPrice(booking.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-slate-50 pt-2 border-t border-white/10">
                  <span>Total Paid</span>
                  <span className="text-green-400">
                    {formatPrice(booking.totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <span
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  booking.status === "confirmed"
                    ? "bg-green-500/20 text-green-200"
                    : booking.status === "cancelled"
                    ? "bg-red-500/20 text-red-200"
                    : "bg-yellow-500/20 text-yellow-200"
                }`}
              >
                {booking.status.toUpperCase()}
              </span>
              
              {booking.paymentStatus && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isScanned
                    ? "bg-red-500/20 text-red-200 border border-red-500/30"
                    : "bg-sky-500/20 text-sky-200 border border-sky-500/30"
                }`}
              >
                {isScanned ? "Ticket Used" : "Ticket Active"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link
                href="/"
                className="flex-1 py-3 text-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Browse More Events
              </Link>
              <Link
                href={`/events/${booking.event?._id}`}
                className="flex-1 py-3 text-center border-2 border-indigo-500 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors font-semibold"
              >
                View Event
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 border border-sky-500/30 bg-sky-500/20 rounded-lg p-4">
          <p className="text-sm text-sky-200">
            💡 <strong>Important:</strong> Please bring a valid ID and this
            booking reference to the event. You can access your booking
            details anytime from your account.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
