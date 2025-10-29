"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import MainLayout from "../../components/MainLayout";
import Link from "next/link";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const eventId = id as Id<"events">;
  const event = useQuery(api.events.get, { id: eventId });
  const tickets = useQuery(api.tickets.listByEvent, { eventId });
  const currentUser = useQuery(api.users.current);

  if (event === undefined || tickets === undefined) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Event Not Found
              </h3>
              <p className="text-gray-600 mb-6">
                The event you're looking for doesn't exist
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

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalTickets = tickets.reduce((sum, t) => sum + t.quantity, 0);
  const soldTickets = tickets.reduce((sum, t) => sum + t.sold, 0);
  const availableTickets = totalTickets - soldTickets;

  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Events
          </Link>

          {/* Event header */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                alt={event.name}
                className="w-full h-64 object-cover"
              />
            )}
            
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {event.name}
                  </h1>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                      event.status
                    )}`}
                  >
                    {event.status}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 text-lg mb-6">{event.description}</p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📅</span>
                  <div>
                    <div className="font-semibold text-gray-900">Date & Time</div>
                    <div className="text-gray-600">{formatDate(event.date)}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <div className="font-semibold text-gray-900">Location</div>
                    <div className="text-gray-600">{event.location}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎫</span>
                  <div>
                    <div className="font-semibold text-gray-900">Availability</div>
                    <div className="text-gray-600">
                      {availableTickets} / {totalTickets} tickets available
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tickets section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Tickets</h2>

            {tickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No ticket types available yet
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {ticket.name}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              ticket.status === "sold_out"
                                ? "bg-red-100 text-red-800"
                                : ticket.status === "available"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {ticket.status === "sold_out"
                              ? "SOLD OUT"
                              : ticket.status === "available"
                              ? "AVAILABLE"
                              : "HIDDEN"}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{ticket.description}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <span>
                            <strong>Available:</strong> {ticket.quantity - ticket.sold} / {ticket.quantity}
                          </span>
                          <span>
                            <strong>Sold:</strong> {ticket.sold}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        <div className="text-3xl font-bold text-indigo-600">
                          {formatPrice(ticket.price)}
                        </div>
                        {ticket.status === "available" && ticket.sold < ticket.quantity && (
                          <button
                            disabled
                            className="mt-3 px-6 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed text-sm"
                          >
                            Booking Soon
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

