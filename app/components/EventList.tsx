"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import EventCard from "./EventCard";

type ViewMode = "all" | "mine";
type Timeframe = "upcoming" | "all" | "past";

const timeframeLabels: Record<Timeframe, string> = {
  upcoming: "Upcoming",
  all: "All Dates",
  past: "Past",
};

export default function EventList() {
  const currentUser = useQuery(api.users.current);
  const allEvents = useQuery(api.events.list);
  const myEvents = useQuery(api.events.myEvents);

  const isAdmin =
    currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin");

  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [timeframe, setTimeframe] = useState<Timeframe>("upcoming");

  const allowedView: ViewMode = isAdmin ? viewMode : "all";
  const viewOptions: ViewMode[] = isAdmin ? ["all", "mine"] : ["all"];

  const sourceEvents = allowedView === "mine" ? myEvents : allEvents;
  const eventsLoading = sourceEvents === undefined;

  const { events, upcomingCount, premiumHosts } = useMemo(() => {
    const now = Date.now();
    const raw = Array.isArray(sourceEvents) ? sourceEvents : [];

    const filtered = raw.filter((event) => {
      const eventTime = new Date(event.date).getTime();
      if (Number.isNaN(eventTime)) return timeframe !== "upcoming";
      if (timeframe === "upcoming") return eventTime >= now;
      if (timeframe === "past") return eventTime < now;
      return true;
    });

    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const upcomingTotal = Array.isArray(allEvents)
      ? allEvents.filter(
          (event) => new Date(event.date).getTime() >= now
        ).length
      : 0;

    const hostSet = new Set(
      (Array.isArray(allEvents) ? allEvents : []).map((event) => event.createdBy)
    );

    return {
      events: filtered,
      upcomingCount: upcomingTotal,
      premiumHosts: hostSet.size,
    };
  }, [allEvents, sourceEvents, timeframe]);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-10 shadow-[0_30px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:px-10">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-500/40 via-purple-500/40 to-cyan-300/30 blur-3xl" />
        <div className="absolute -bottom-48 -left-16 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-400/20 via-teal-400/20 to-transparent blur-3xl" />

        <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-100/80">
              Premium Access
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
              Craft experiences that feel extraordinary
            </h1>
            <p className="max-w-xl text-sm text-slate-200/80 sm:text-base">
              Browse curated events or elevate the vibe with your own. Every experience is
              designed to impress VIP guests and discerning audiences.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                <span className="text-lg">🎤</span>
                <span>
                  {upcomingCount} upcoming{" "}
                  <span className="text-indigo-200">headline moments</span>
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                <span className="text-lg">🤝</span>
                <span>
                  {premiumHosts} premium{" "}
                  <span className="text-indigo-200">hosts on platform</span>
                </span>
              </div>
            </div>
          </div>

          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-5 text-slate-100 shadow-lg backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.4em] text-slate-300/80">
              <span>View</span>
              <span>Mode</span>
            </div>
            <div className="mt-4 flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
              {viewOptions.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    allowedView === mode
                      ? "bg-gradient-to-r from-[#483d8b]/85 to-[#6a5acd]/85 text-white shadow-lg shadow-[0_18px_45px_rgba(72,61,139,0.28)]"
                      : "text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {mode === "all" ? "All Experiences" : "Hosted by Me"}
                </button>
              ))}
            </div>
            {isAdmin ? (
              <p className="mt-4 text-xs text-slate-300/70">
                Host view gives you full control over premium experiences you curate.
              </p>
            ) : (
              <p className="mt-4 text-xs text-slate-300/70">
                Create an event to join our network of premium hosts.
              </p>
            )}
            <div className="mt-6">
              <Link
                href={isAdmin ? "/create" : "/"}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.36)]"
              >
                {isAdmin ? "Plan a Signature Event" : "Explore Premium Highlights"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white md:text-2xl">
              Presents tailored for {viewMode === "mine" ? "your guests" : "your audience"}
            </h2>
            <p className="text-sm text-slate-300/80">
              Choose a timeframe to reveal high-impact lineups.
            </p>
          </div>
          <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
            {(Object.keys(timeframeLabels) as Timeframe[]).map((option) => (
              <button
                key={option}
                onClick={() => setTimeframe(option)}
                className={`rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                  timeframe === option
                    ? "bg-white/15 text-white shadow-inner shadow-slate-900/20"
                    : "text-slate-300/80 hover:bg-white/10"
                }`}
              >
                {timeframeLabels[option]}
              </button>
            ))}
          </div>
        </div>

        {eventsLoading ? (
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
        ) : events.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 px-8 py-14 text-center text-slate-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-2xl">
              {timeframe === "past" ? "🕰️" : "🌌"}
            </div>
            <h3 className="mt-6 text-xl font-semibold text-white">
              No events in this view yet
            </h3>
            <p className="mt-2 text-sm text-slate-300/80">
              {viewMode === "mine"
                ? "Craft a signature experience and we’ll showcase it here."
                : "Adjust your timeframe or check back as our curators add new highlights."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event._id} event={event} isAdmin={isAdmin ?? false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

