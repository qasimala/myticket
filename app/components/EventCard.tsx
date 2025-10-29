"use client";

import { Doc, Id } from "../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import TicketManager from "./TicketManager";
import Link from "next/link";

interface EventCardProps {
  event: Doc<"events">;
}

export default function EventCard({ event }: EventCardProps) {
  const [showTickets, setShowTickets] = useState(false);
  const tickets = useQuery(api.tickets.listByEvent, { eventId: event._id });
  const currentUser = useQuery(api.users.current);
  const publishEvent = useMutation(api.events.publish);
  const updateEvent = useMutation(api.events.update);
  const removeEvent = useMutation(api.events.remove);

  const isAdmin = currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  const totalTickets = tickets?.reduce((sum, t) => sum + t.quantity, 0) || 0;
  const soldTickets = tickets?.reduce((sum, t) => sum + t.sold, 0) || 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-2xl font-bold text-gray-900">{event.name}</h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
              event.status
            )}`}
          >
            {event.status}
          </span>
        </div>

        <p className="text-gray-600 mb-4">{event.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-700">
            <span className="font-semibold mr-2">📅 Date:</span>
            {formatDate(event.date)}
          </div>
          <div className="flex items-center text-gray-700">
            <span className="font-semibold mr-2">📍 Location:</span>
            {event.location}, {event.city}, {event.country}
          </div>
          <div className="flex items-center text-gray-700">
            <span className="font-semibold mr-2">🎫 Tickets:</span>
            {soldTickets} / {totalTickets} sold
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/events/${event._id}`}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            View Details
          </Link>

          {isAdmin && (
            <>
              <button
                onClick={() => setShowTickets(!showTickets)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {showTickets ? "Hide Tickets" : "Manage Tickets"}
              </button>

              {event.status === "draft" && (
                <button
                  onClick={() => publishEvent({ id: event._id })}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Publish
                </button>
              )}

              {event.status === "published" && (
                <button
                  onClick={() => updateEvent({ id: event._id, status: "cancelled" })}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Cancel Event
                </button>
              )}

              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${event.name}"?`)) {
                    removeEvent({ id: event._id });
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>

        {isAdmin && showTickets && <TicketManager eventId={event._id} />}
      </div>
    </div>
  );
}

