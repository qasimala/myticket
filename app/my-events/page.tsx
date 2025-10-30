"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import MainLayout from "../components/MainLayout";
import EventCard from "../components/EventCard";
import { api } from "../../convex/_generated/api";

export default function MyEventsPage() {
  const currentUser = useQuery(api.users.current);
  const myEvents = useQuery(api.events.myEvents);

  const isAdmin =
    currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin");

  const renderContent = () => {
    if (!currentUser) {
      return (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-10 py-16 text-center text-slate-100 shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl">
            🔐
          </div>
          <h2 className="mt-6 text-2xl font-semibold">Sign in to manage showcases</h2>
          <p className="mt-3 text-sm text-slate-300/80">
            Securely authenticate to create, refine, or relaunch your signature events.
          </p>
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <div className="rounded-3xl border border-amber-300/20 bg-amber-400/10 px-10 py-16 text-center text-amber-100 shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-3xl">
            🚧
          </div>
          <h2 className="mt-6 text-2xl font-semibold">Access reserved for hosts</h2>
          <p className="mt-3 text-sm text-amber-100/80">
            Request elevated permissions to produce high-touch experiences on MyTicket.
          </p>
        </div>
      );
    }

    if (myEvents === undefined) {
      return (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <div className="h-40 rounded-2xl bg-white/10" />
              <div className="mt-6 h-4 w-3/4 rounded bg-white/10" />
              <div className="mt-3 h-3 w-2/3 rounded bg-white/10" />
              <div className="mt-8 h-10 rounded-xl bg-white/10" />
            </div>
          ))}
        </div>
      );
    }

    if (myEvents.length === 0) {
      return (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-10 py-16 text-center text-slate-100 shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-3xl">
            📝
          </div>
          <h2 className="mt-6 text-2xl font-semibold">You haven’t launched yet</h2>
          <p className="mt-3 text-sm text-slate-300/80">
            Craft a bespoke event to start captivating your audience.
          </p>
          <Link
            href="/create"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50"
          >
            Create your first event
          </Link>
        </div>
      );
    }

    return (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {myEvents.map((event) => (
          <EventCard key={event._id} event={event} isAdmin />
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-10 shadow-[0_30px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:px-10">
          <div className="absolute -right-32 top-0 h-60 w-60 rounded-full bg-gradient-to-br from-indigo-500/30 via-sky-400/20 to-transparent blur-3xl" />
          <div className="absolute -bottom-40 left-10 h-80 w-80 rounded-full bg-gradient-to-br from-purple-500/25 via-rose-400/20 to-transparent blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3 max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-300">
                Host Command Deck
              </p>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Elevate every guest touchpoint
              </h1>
              <p className="text-sm text-slate-300/80">
                Fine-tune your events, monitor momentum, and ensure the experience reflects
                your brand’s signature energy.
              </p>
            </div>
            {isAdmin && (
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/45"
              >
                Launch new experience
              </Link>
            )}
          </div>
        </section>

        {renderContent()}
      </div>
    </MainLayout>
  );
}
