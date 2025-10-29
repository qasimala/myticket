"use client";

import { use, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import MainLayout from "../../components/MainLayout";
import Link from "next/link";
import Script from "next/script";

export default function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bookingId = id as Id<"bookings">;
  const booking = useQuery(api.bookings.getBooking, { bookingId });
  const initializePayment = useMutation(api.payments.initializePayment);
  
  const [paymentData, setPaymentData] = useState<{
    checkoutId: string;
    widgetUrl: string;
  } | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState("");

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  // Initialize payment on mount
  useEffect(() => {
    if (booking && booking.paymentStatus === "pending" && !paymentData && !isInitializing) {
      initPayment();
    }
  }, [booking]);

  const initPayment = async () => {
    setIsInitializing(true);
    setError("");
    
    try {
      const result = await initializePayment({ bookingId });
      setPaymentData({
        checkoutId: result.checkoutId,
        widgetUrl: result.widgetUrl,
      });
    } catch (err: any) {
      setError(err.message || "Failed to initialize payment");
      setIsInitializing(false);
    }
  };

  if (booking === undefined) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 rounded w-1/3"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!booking) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Booking Not Found
              </h3>
              <p className="text-gray-600 mb-6">
                The booking you're trying to pay for doesn't exist
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Back to Events
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (booking.paymentStatus === "completed") {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Payment Already Completed
              </h3>
              <p className="text-gray-600 mb-6">
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
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
            <p className="text-gray-600 mt-1">
              Secure payment powered by PeachPayments
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Payment Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md p-6">
                {error ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Payment Initialization Failed
                    </h3>
                    <p className="text-red-600 mb-6">{error}</p>
                    <button
                      onClick={initPayment}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                    >
                      Try Again
                    </button>
                  </div>
                ) : !paymentData ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Initializing secure payment...</p>
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
                      <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Payment Information
                      </h2>
                      <p className="text-sm text-gray-600 mb-4">
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
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-800 font-semibold mb-2">
                        💡 Test Mode - Use these test cards:
                      </p>
                      <div className="text-xs text-blue-700 space-y-1">
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
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Order Summary
                </h2>

                {/* Event Details */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="text-sm font-semibold text-gray-900 mb-2">
                    {booking.event?.name}
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    📍 {booking.event?.location}
                  </div>
                  <div className="text-xs text-gray-600">
                    {booking.event?.city}, {booking.event?.country}
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{booking.ticket?.name}</span>
                    <span className="font-semibold">× {booking.quantity}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="space-y-2">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-indigo-600">
                      {formatPrice(booking.totalPrice)}
                    </span>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
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
      </div>
    </MainLayout>
  );
}

