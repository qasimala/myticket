"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import MainLayout from "../../components/MainLayout";
import Link from "next/link";

export default function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bookingId = id as Id<"bookings">;
  const booking = useQuery(api.bookings.getBooking, { bookingId });

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

  if (booking === undefined) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!booking) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Booking Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              The booking you're looking for doesn't exist
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Message */}
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center mb-6">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-gray-600">
              Your tickets have been successfully booked. A confirmation email
              has been sent to <strong>{booking.customerEmail}</strong>
            </p>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
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
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Booking Reference</div>
                <div className="text-lg font-mono font-bold text-gray-900">
                  {booking._id}
                </div>
              </div>

              {/* Event Details */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {booking.event?.name}
                </h2>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <div className="font-semibold text-gray-900">Date & Time</div>
                      <div className="text-gray-600">
                        {booking.event?.date && formatDate(booking.event.date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <div className="font-semibold text-gray-900">Location</div>
                      <div className="text-gray-600">
                        {booking.event?.location}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.event?.city}, {booking.event?.country}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Ticket Information
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {booking.ticket?.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {booking.ticket?.description}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        × {booking.quantity}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Customer Information
                </h3>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Name:</span>{" "}
                    <span className="font-medium text-gray-900">
                      {booking.customerName}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email:</span>{" "}
                    <span className="font-medium text-gray-900">
                      {booking.customerEmail}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Booking Date:</span>{" "}
                    <span className="font-medium text-gray-900">
                      {formatBookingDate(booking.bookingDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Payment Summary
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Tickets ({booking.quantity})</span>
                    <span>{formatPrice(booking.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total Paid</span>
                    <span className="text-green-600">
                      {formatPrice(booking.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-bold ${
                    booking.status === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : booking.status === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {booking.status.toUpperCase()}
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
                  className="flex-1 py-3 text-center border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-semibold"
                >
                  View Event
                </Link>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Important:</strong> Please bring a valid ID and this
              booking reference to the event. You can access your booking
              details anytime from your account.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

