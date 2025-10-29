"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import EventCard from "../components/EventCard";
import MainLayout from "../components/MainLayout";
import Link from "next/link";

export default function MyEventsPage() {
  const currentUser = useQuery(api.users.current);
  const myEvents = useQuery(api.events.myEvents);
  const isAdmin = currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin");

  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
            <p className="text-gray-600 mt-1">Events you've created</p>
          </div>

          {!currentUser ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sign In Required
              </h3>
              <p className="text-gray-600 mb-4">
                Please sign in to view your events
              </p>
            </div>
          ) : !isAdmin ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Admin Access Required
              </h3>
              <p className="text-gray-600 mb-4">
                Only administrators can create and manage events
              </p>
              <p className="text-sm text-gray-500">
                You can still browse all available events
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {myEvents === undefined ? (
                <div className="text-center py-12">
                  <div className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-48 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              ) : myEvents.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No events yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Create your first event to get started!
                  </p>
                  <Link
                    href="/create"
                    className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                  >
                    Create Event
                  </Link>
                </div>
              ) : (
                myEvents.map((event) => <EventCard key={event._id} event={event} />)
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

