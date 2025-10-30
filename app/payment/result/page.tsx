"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import MainLayout from "../../components/MainLayout";
import Link from "next/link";

function PaymentStatusFallback() {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <div className="mx-auto w-full">
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Loading Payment Status
            </h3>
            <p className="text-gray-600">
              Preparing your payment details...
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId") as Id<"bookings"> | null;

  const paymentStatus = useQuery(
    api.payments.checkPaymentStatus,
    bookingId ? { bookingId } : "skip"
  );

  const [isChecking, setIsChecking] = useState(true);
  const [checkAttempts, setCheckAttempts] = useState(0);

  useEffect(() => {
    if (!bookingId) {
      setIsChecking(false);
      return;
    }

    const interval = setInterval(() => {
      setCheckAttempts((prev) => prev + 1);
    }, 2000);

    if (checkAttempts >= 10) {
      clearInterval(interval);
      setIsChecking(false);
    }

    if (paymentStatus && paymentStatus.paymentStatus !== "processing") {
      clearInterval(interval);
      setIsChecking(false);
    }

    return () => clearInterval(interval);
  }, [bookingId, checkAttempts, paymentStatus]);

  useEffect(() => {
    if (
      bookingId &&
      paymentStatus &&
      paymentStatus.paymentStatus === "completed" &&
      paymentStatus.status === "confirmed"
    ) {
      router.replace(`/bookings/${bookingId}`);
    }
  }, [bookingId, paymentStatus, router]);

  if (!bookingId) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <div className="mx-auto w-full">
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">:(</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Invalid Payment Reference
              </h3>
              <p className="text-gray-600 mb-6">No booking ID provided</p>
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

  if (isChecking || !paymentStatus) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <div className="mx-auto w-full">
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Verifying Payment
              </h3>
              <p className="text-gray-600">
                Please wait while we confirm your payment...
              </p>
              <p className="text-sm text-gray-500 mt-4">
                This may take a few moments
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (
    paymentStatus.paymentStatus === "completed" &&
    paymentStatus.status === "confirmed"
  ) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <div className="mx-auto w-full">
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-12 text-center mb-6">
              <div className="text-6xl mb-4">:)</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Payment Successful!
              </h1>
              <p className="text-gray-600 mb-6">
                Your booking has been confirmed and payment processed successfully.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href={`/bookings/${bookingId}`}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                >
                  View Booking Details
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-semibold"
                >
                  Browse More Events
                </Link>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Next Steps:</strong> A confirmation email has been sent to
                your email address. You can access your booking anytime from "My
                Bookings" in the sidebar.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (paymentStatus.paymentStatus === "failed") {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <div className="mx-auto w-full">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-12 text-center mb-6">
              <div className="text-6xl mb-4">:(</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Payment Failed
              </h1>
              <p className="text-gray-600 mb-6">
                Your payment could not be processed. Your booking has been cancelled
                and tickets have been released.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href={`/payment/${bookingId}`}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                >
                  Try Again
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Back to Events
                </Link>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Payment Issues?</strong> Please check your card details and
                try again. If the problem persists, contact your bank or try a
                different payment method.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <div className="mx-auto w-full">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">...</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Processing
            </h1>
            <p className="text-gray-600 mb-6">
              Your payment is still being processed. This usually takes a few
              moments.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Refresh Status
              </button>
              <Link
                href="/my-bookings"
                className="px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-semibold"
              >
                View My Bookings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<PaymentStatusFallback />}>
      <PaymentResultContent />
    </Suspense>
  );
}
