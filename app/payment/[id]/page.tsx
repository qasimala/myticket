"use client";

import { useEffect, useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import MainLayout from "../../components/MainLayout";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

export default function PaymentPage() {
  const params = useParams<{ id: string }>();
  const idParam = Array.isArray(params?.id) ? params?.id[0] : params?.id;

  const router = useRouter();

  const bookingId = idParam ? (idParam as Id<"bookings">) : null;
  const booking = useQuery(
    api.bookings.getBooking,
    bookingId ? { bookingId } : "skip"
  );
  const initializePayment = useAction(api.payments.initializePayment);
  
  const [paymentData, setPaymentData] = useState<{
    checkoutId: string;
    widgetUrl: string;
    isMock?: boolean;
  } | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState("");

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const missingBookingId = !bookingId;

  // Initialize payment on mount
  useEffect(() => {
    if (booking && booking.paymentStatus === "pending" && !paymentData && !isInitializing) {
      initPayment();
    }
  }, [booking, paymentData, isInitializing]);

  const initPayment = async () => {
    if (!bookingId) {
      setError("Missing booking reference. Please use a valid payment link.");
      return;
    }
    setIsInitializing(true);
    setError("");
    
    try {
      const result = await initializePayment({ bookingId });

      if (!result.widgetUrl || result.isMock) {
        setPaymentData({
          checkoutId: result.checkoutId,
          widgetUrl: "",
          isMock: true,
        });
        router.push(`/payment/result?bookingId=${bookingId}`);
        return;
      }

      setPaymentData({
        checkoutId: result.checkoutId,
        widgetUrl: result.widgetUrl,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to initialize payment";
      setError(message);
    } finally {
      setIsInitializing(false);
    }
  };

  if (booking === undefined) {
    return (
      <MainLayout>
        <div className="mx-auto w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-slate-800 rounded w-1/3"></div>
            <div className="h-96 bg-slate-800 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!booking) {
    return (
      <MainLayout>
        <div className="mx-auto w-full">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-10 py-16 text-center text-red-100 shadow-xl backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-3xl">
              ❌
            </div>
            <h3 className="mt-6 text-2xl font-semibold">Booking Not Found</h3>
            <p className="mt-3 text-sm text-red-100/80">
              The booking you&apos;re trying to pay for doesn&apos;t exist
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (booking.paymentStatus === "completed") {
    return (
      <MainLayout>
        <div className="mx-auto w-full">
          <div className="border-2 border-green-500/30 bg-green-500/20 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-slate-50 mb-2">
              Payment Already Completed
            </h3>
            <p className="text-slate-300 mb-6">
              This booking has already been paid for
            </p>
            <Link
              href={`/bookings/${booking._id}`}
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              View Booking
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (missingBookingId) {
    return (
      <MainLayout>
        <div className="mx-auto w-full">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-10 py-16 text-center text-red-100 shadow-xl backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-3xl">
              ❌
            </div>
            <h3 className="mt-6 text-2xl font-semibold">Payment Link Invalid</h3>
            <p className="mt-3 text-sm text-red-100/80">
              Please return to your bookings to resume checkout.
            </p>
            <Link
              href="/my-bookings"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50"
            >
              View My Bookings
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto w-full">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-50">Complete Payment</h1>
          <p className="text-slate-400 mt-1">
            Secure payment powered by PeachPayments
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="border border-white/10 bg-slate-900/80 rounded-xl shadow-lg p-6">
              {error ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-xl font-semibold text-slate-50 mb-2">
                    Payment Initialization Failed
                  </h3>
                  <p className="text-red-400 mb-6">{error}</p>
                  <button
                    onClick={initPayment}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                  >
                    Try Again
                  </button>
                </div>
              ) : !paymentData ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                  <p className="text-slate-400">Initializing secure payment...</p>
                </div>
              ) : (
                paymentData.isMock ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                    <p className="text-slate-400">
                      Finalizing your booking...
                    </p>
                  </div>
                ) : (
                <>
                  {/* Load PeachPayments Widget */}
                  <Script
                    src={paymentData.widgetUrl}
                    strategy="afterInteractive"
                    onLoad={() => {
                      console.log("PeachPayments widget loaded");
                    }}
                  />
                  
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-50 mb-4">
                      Payment Information
                    </h2>
                    <p className="text-sm text-slate-400 mb-4">
                      Enter your payment details below. All transactions are
                      secure and encrypted.
                    </p>
                  </div>

                  {/* PeachPayments Payment Form */}
                  <form
                    action={`/payment/result?bookingId=${booking._id}`}
                    className="paymentWidgets"
                    data-brands="VISA MASTER AMEX"
                  ></form>

                  {/* Test Card Info (for development) */}
                  <div className="mt-6 p-4 bg-sky-500/20 rounded-lg">
                    <p className="text-xs text-sky-200 font-semibold mb-2">
                      💡 Test Mode - Use these test cards:
                    </p>
                    <div className="text-xs text-sky-300 space-y-1">
                      <div>
                        <strong>Success:</strong> 4200 0000 0000 0000
                      </div>
                      <div>
                        <strong>Declined:</strong> 4000 3000 1111 2220
                      </div>
                      <div>
                        <strong>CVV:</strong> Any 3 digits | <strong>Expiry:</strong> Any future date
                      </div>
                    </div>
                  </div>
                </>
                )
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="border border-white/10 bg-slate-900/80 rounded-xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-slate-50 mb-4">
                Order Summary
              </h2>

              {/* Event Details */}
              <div className="mb-4 pb-4 border-b border-white/10">
                <div className="text-sm font-semibold text-slate-100 mb-2">
                  {booking.event?.name}
                </div>
                <div className="text-xs text-slate-400 mb-1">
                  📍 {booking.event?.location}
                </div>
                <div className="text-xs text-slate-400">
                  {booking.event?.city}, {booking.event?.country}
                </div>
              </div>

              {/* Ticket Details */}
              <div className="mb-4 pb-4 border-b border-white/10">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{booking.ticket?.name}</span>
                  <span className="font-semibold">× {booking.quantity}</span>
                </div>
              </div>

              {/* Total */}
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-bold text-slate-50">
                  <span>Total</span>
                  <span className="text-indigo-400">
                    {formatPrice(booking.totalPrice)}
                  </span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Secure Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

