"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import MainLayout from "../components/MainLayout";
import Link from "next/link";

export default function MyBookingsPage() {
  const currentUser = useQuery(api.users.current);
  const bookings = useQuery(api.bookings.myBookings);
  const cancelBooking = useMutation(api.bookings.cancelBooking);

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatBookingDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (
      confirm(
        "Are you sure you want to cancel this booking? This action cannot be undone."
      )
    ) {
      try {
        await cancelBooking({ bookingId: bookingId as any });
      } catch (err: any) {
        alert(err.message || "Failed to cancel booking");
      }
    }
  };

  if (!currentUser) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Sign In Required
            </h3>
            <p className="text-gray-600">
              Please sign in to view your bookings
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (bookings === undefined) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">
            View and manage your ticket bookings
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🎟️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No bookings yet
            </h3>
            <p className="text-gray-600 mb-6">
              Browse events and book tickets to get started
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Event Image */}
                    {booking.event?.imageUrl && (
                      <div className="lg:w-48 h-32 lg:h-auto flex-shrink-0">
                        <img
                          src={booking.event.imageUrl}
                          alt={booking.event.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Booking Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link
                            href={`/events/${booking.event?._id}`}
                            className="text-xl font-bold text-gray-900 hover:text-indigo-600"
                          >
                            {booking.event?.name}
                          </Link>
                          <div className="text-sm text-gray-500 mt-1">
                            Booked on {formatBookingDate(booking.bookingDate)}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-gray-700">
                          <span className="text-sm">
                            📅 {booking.event?.date && formatDate(booking.event.date)}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <span className="text-sm">
                            📍 {booking.event?.location}, {booking.event?.city},{" "}
                            {booking.event?.country}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <span className="text-sm">
                            🎫 {booking.ticket?.name} × {booking.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div>
                          <div className="text-sm text-gray-500">Total Paid</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {formatPrice(booking.totalPrice)}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link
                            href={`/bookings/${booking._id}`}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-sm"
                          >
                            View Details
                          </Link>
                          {booking.status === "confirmed" && (
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold text-sm"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

