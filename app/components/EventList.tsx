"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import EventCard from "./EventCard";
import CreateEventForm from "./CreateEventForm";
import { useState } from "react";

export default function EventList() {
  const currentUser = useQuery(api.users.current);
  const allEvents = useQuery(api.events.list);
  const myEvents = useQuery(api.events.myEvents);
  const [showMyEventsOnly, setShowMyEventsOnly] = useState(false);

  const events = showMyEventsOnly ? myEvents : allEvents;

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">Events</h1>
        <p className="text-gray-600">
          {showMyEventsOnly ? "Your events" : "All events"}
        </p>
      </div>

      {currentUser && (
        <div className="mb-6 flex gap-4 items-center">
          <button
            onClick={() => setShowMyEventsOnly(!showMyEventsOnly)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              showMyEventsOnly
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            {showMyEventsOnly ? "Show All Events" : "Show My Events"}
          </button>
        </div>
      )}

      {currentUser && (
        <div className="mb-8">
          <CreateEventForm />
        </div>
      )}

      {!currentUser && (
        <div className="mb-8 bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600">
            Sign in to create and manage your own events
          </p>
        </div>
      )}

      <div className="space-y-6">
        {events === undefined ? (
          <div className="text-center py-12">
            <div className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No events yet
            </h3>
            <p className="text-gray-600">
              Create your first event to get started!
            </p>
          </div>
        ) : (
          events.map((event) => <EventCard key={event._id} event={event} />)
        )}
      </div>
    </div>
  );
}

