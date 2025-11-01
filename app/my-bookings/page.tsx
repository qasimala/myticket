"use client";

import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import MainLayout from "../components/MainLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Calendar, MapPin, Ticket } from "lucide-react";
import { useCachedQuery } from "../lib/useCachedQuery";
import { useOffline } from "../lib/useOffline";

export default function MyBookingsPage() {
  const router = useRouter();
  const isOffline = useOffline();
  const currentUser = useCachedQuery(api.users.current, undefined, {
    cacheKey: "current_user",
    cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  const bookingsByEvent = useCachedQuery<Array<{
    event: any;
    bookings: any[];
  }>>(api.bookings.myBookingsByEvent, undefined, {
    cacheKey: "my_bookings_by_event",
    cacheTTL: 60 * 60 * 1000, // 1 hour
  });


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

  // When offline, handle differently - don't wait for data that won't come
  if (isOffline) {
    // If we have no cached user data, show offline message
    if (currentUser === undefined) {
      return (
        <MainLayout>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-50">My Bookings</h1>
            <p className="text-slate-400 mt-1">
              View events you&apos;ve booked tickets for
            </p>
          </div>
          <div className="rounded-3xl border border-orange-500/20 bg-orange-500/10 px-10 py-16 text-center text-orange-100 shadow-xl backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20 text-3xl">
              📡
            </div>
            <h3 className="mt-6 text-2xl font-semibold">Offline Mode</h3>
            <p className="mt-3 text-sm text-orange-100/80">
              No cached data available. Please connect to the internet to view your bookings.
            </p>
          </div>
        </MainLayout>
      );
    }
    
    // If user is cached but null (not signed in), show sign in required
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
    
    // If we have cached user, proceed even if bookingsByEvent is undefined
    // We'll show empty state below
  } else {
    // When online, show loading while data is being fetched
    if (currentUser === undefined || bookingsByEvent === undefined) {
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

    // When online, check authentication
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
  }
  
  // For offline mode, use empty array if bookingsByEvent is undefined
  const displayBookings = bookingsByEvent || [];

  const totalTicketsForEvent = (eventId: Id<"events">) => {
    const group = displayBookings.find((g) => g.event?._id === eventId);
    if (!group) return 0;
    return group.bookings.reduce((sum, b) => sum + b.quantity, 0);
  };

  const totalPriceForEvent = (eventId: Id<"events">) => {
    const group = displayBookings.find((g) => g.event?._id === eventId);
    if (!group) return 0;
    return group.bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-50">My Bookings</h1>
        <p className="text-slate-400 mt-1">
          View events you&apos;ve booked tickets for
        </p>
      </div>

      {!displayBookings || displayBookings.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-10 py-16 text-center text-slate-100 shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl">
            🎟️
          </div>
          <h3 className="mt-6 text-2xl font-semibold">No bookings yet</h3>
          <p className="mt-3 text-sm text-slate-300/80">
            {isOffline 
              ? "No cached bookings available. Connect to the internet to view your bookings."
              : "Browse events and book tickets to get started"}
          </p>
          {!isOffline && (
            <Link
              href="/"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.36)]"
            >
              Browse Events
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isOffline && (
            <div className="col-span-full mb-4 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3">
              <p className="text-sm font-semibold text-orange-200">
                📡 Showing cached data - Some information may be outdated
              </p>
            </div>
          )}
          {displayBookings.map(({ event, bookings }) => {
            if (!event) return null;
            const totalTickets = totalTicketsForEvent(event._id);
            const totalPrice = totalPriceForEvent(event._id);
            const hasPending = bookings.some(
              (b) => b.paymentStatus === "pending"
            );
            const hasConfirmed = bookings.some((b) => b.status === "confirmed");

            return (
              <div
                key={event._id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-lg transition-all hover:border-white/20 hover:shadow-xl animate-fade-up"
              >
                {/* Event Image */}
                {event.imageUrl && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.imageUrl}
                      alt={event.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                  </div>
                )}

                {/* Event Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-50 mb-2 line-clamp-2">
                      {event.name}
                    </h3>
                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar
                          className="h-4 w-4 text-slate-400"
                          strokeWidth={1.8}
                        />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin
                          className="h-4 w-4 text-slate-400"
                          strokeWidth={1.8}
                        />
                        <span className="line-clamp-1">
                          {event.location}, {event.city}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket
                          className="h-4 w-4 text-slate-400"
                          strokeWidth={1.8}
                        />
                        <span>
                          {totalTickets}{" "}
                          {totalTickets === 1 ? "ticket" : "tickets"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider">
                        Total Spent
                      </div>
                      <div className="text-xl font-bold text-slate-50">
                        {formatPrice(totalPrice)}
                      </div>
                    </div>
                    <Link
                      href={`/my-bookings/${event._id}`}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10"
                    >
                      View Tickets
                      <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                    </Link>
                  </div>

                  {/* Status badges */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {hasPending && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-200">
                        Payment Pending
                      </span>
                    )}
                    {hasConfirmed && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-200">
                        Confirmed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
}
