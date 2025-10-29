"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import CreateEventForm from "../components/CreateEventForm";
import MainLayout from "../components/MainLayout";

export default function CreateEventPage() {
  const currentUser = useQuery(api.users.current);
  const isAdmin = currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin");

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <div className="w-full">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
            <p className="text-gray-600 mt-1">Fill in the details below to create your event</p>
          </div>

          {!currentUser ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sign In Required
              </h3>
              <p className="text-gray-600">
                Please sign in to access this page
              </p>
            </div>
          ) : !isAdmin ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Admin Access Required
              </h3>
              <p className="text-gray-600 mb-4">
                Only administrators can create events
              </p>
              <p className="text-sm text-gray-500">
                Contact a superadmin to request admin privileges
              </p>
            </div>
          ) : (
            <CreateEventForm />
          )}
        </div>
      </div>
    </MainLayout>
  );
}

