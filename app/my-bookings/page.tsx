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
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-10 py-16 text-center text-red-100 shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-3xl">
            🔒
          </div>
          <h3 className="mt-6 text-2xl font-semibold">Sign In Required</h3>
          <p className="mt-3 text-sm text-red-100/80">
            Please sign in to view your bookings
          </p>
        </div>
      </MainLayout>
    );
  }

  if (bookings === undefined) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-800 rounded w-1/4"></div>
          <div className="h-32 bg-slate-800 rounded"></div>
          <div className="h-32 bg-slate-800 rounded"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-50">My Bookings</h1>
        <p className="text-slate-400 mt-1">
          View and manage your ticket bookings
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-10 py-16 text-center text-slate-100 shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl">
            🎟️
          </div>
          <h3 className="mt-6 text-2xl font-semibold">No bookings yet</h3>
          <p className="mt-3 text-sm text-slate-300/80">
            Browse events and book tickets to get started
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="border border-white/10 rounded-2xl bg-slate-900/80 shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
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
                          className="text-xl font-bold text-slate-50 hover:text-indigo-400"
                        >
                          {booking.event?.name}
                        </Link>
                        <div className="text-sm text-slate-400 mt-1">
                          Booked on {formatBookingDate(booking.bookingDate)}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
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
                        {booking.paymentStatus === "pending" && (
                          <Link
                            href={`/payment/${booking._id}`}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            Complete Payment →
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-slate-300">
                        <span className="text-sm">
                          📅 {booking.event?.date && formatDate(booking.event.date)}
                        </span>
                      </div>
                      <div className="flex items-center text-slate-300">
                        <span className="text-sm">
                          📍 {booking.event?.location}, {booking.event?.city},{" "}
                          {booking.event?.country}
                        </span>
                      </div>
                      <div className="flex items-center text-slate-300">
                        <span className="text-sm">
                          🎫 {booking.ticket?.name} × {booking.quantity}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div>
                        <div className="text-sm text-slate-400">Total Paid</div>
                        <div className="text-2xl font-bold text-slate-50">
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
                            className="px-4 py-2 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors font-semibold text-sm"
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
    </MainLayout>
  );
}

