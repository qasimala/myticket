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
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-50">Create New Event</h1>
          <p className="text-slate-400 mt-1">Fill in the details below to create your event</p>
        </div>

        {!currentUser ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-10 py-16 text-center text-red-100 shadow-xl backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-3xl">
              🔒
            </div>
            <h3 className="mt-6 text-2xl font-semibold">Sign In Required</h3>
            <p className="mt-3 text-sm text-red-100/80">
              Please sign in to access this page
            </p>
          </div>
        ) : !isAdmin ? (
          <div className="rounded-3xl border border-amber-300/20 bg-amber-400/10 px-10 py-16 text-center text-amber-100 shadow-xl backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-3xl">
              ⚠️
            </div>
            <h3 className="mt-6 text-2xl font-semibold">Admin Access Required</h3>
            <p className="mt-3 text-sm text-amber-100/80">
              Only administrators can create events
            </p>
            <p className="text-sm text-amber-200/80 mt-2">
              Contact a superadmin to request admin privileges
            </p>
          </div>
        ) : (
          <CreateEventForm />
        )}
      </div>
    </MainLayout>
  );
}

