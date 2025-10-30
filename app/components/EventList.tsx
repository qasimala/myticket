"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import {
  CalendarDays,
  CalendarX2,
  Clock3,
  Crown,
  Sparkles,
  Users,
} from "lucide-react";
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
    currentUser &&
    (currentUser.role === "admin" || currentUser.role === "superadmin");

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

    filtered.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const upcomingTotal = Array.isArray(allEvents)
      ? allEvents.filter((event) => new Date(event.date).getTime() >= now)
          .length
      : 0;

    const hostSet = new Set(
      (Array.isArray(allEvents) ? allEvents : []).map(
        (event) => event.createdBy
      )
    );

    return {
      events: filtered,
      upcomingCount: upcomingTotal,
      premiumHosts: hostSet.size,
    };
  }, [allEvents, sourceEvents, timeframe]);

  const heroMetrics = [
    {
      label: "Headline Moments",
      value: upcomingCount,
      accent: "upcoming",
      icon: CalendarDays,
    },
    {
      label: "Premium Hosts",
      value: premiumHosts,
      accent: "trusted curators",
      icon: Users,
    },
  ];

  const timeframeInfo: Record<Timeframe, { title: string; subtitle: string }> =
    {
      upcoming: {
        title: "Upcoming spotlights",
        subtitle: "Secure elevated experiences for the days ahead.",
      },
      all: {
        title: "All curated dates",
        subtitle: "Review every experience in one premium stream.",
      },
      past: {
        title: "Past highlights",
        subtitle: "Reflect on signature events and host momentum.",
      },
    };

  const EmptyIcon = timeframe === "past" ? Clock3 : CalendarX2;

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/[0.05] px-6 py-12 shadow-[0_40px_120px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:px-10 lg:px-12 animate-fade-up">
        <div className="absolute -right-40 -top-48 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/40 via-purple-500/35 to-cyan-400/25 blur-3xl" />
        <div className="absolute -bottom-52 -left-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-cyan-400/20 via-teal-400/25 to-transparent blur-[200px]" />
        <div className="absolute inset-0 rounded-[2.75rem] border border-white/5 opacity-40" />

        <div className="relative flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-6 lg:max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.5em] text-slate-200/90">
              <Sparkles
                className="h-3.5 w-3.5 text-indigo-200"
                strokeWidth={1.8}
              />
              Premium Access
            </span>
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
                Craft experiences that feel extraordinary
              </h1>
              <p className="max-w-xl text-sm text-slate-200/80 sm:text-base">
                Browse curated events or elevate the vibe with your own. Every
                experience is designed to impress VIP guests and discerning
                audiences.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {heroMetrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 animate-fade-up"
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <Icon
                        className="h-5 w-5 text-indigo-200"
                        strokeWidth={1.7}
                      />
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {metric.value}
                      </p>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                        {metric.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative w-full max-w-sm rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 text-slate-100 shadow-[0_30px_80px_rgba(15,23,42,0.55)] backdrop-blur-xl">
            <div className="absolute inset-0 rounded-[2rem] border border-white/10 opacity-60" />
            <div className="pointer-events-none absolute inset-x-5 top-5 h-10 rounded-full bg-gradient-to-r from-indigo-400/25 via-transparent to-purple-400/25 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.45em] text-slate-300/80">
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
                        ? "bg-gradient-to-r from-[#483d8b]/90 to-[#6a5acd]/90 text-white shadow-lg shadow-[0_18px_45px_rgba(72,61,139,0.28)]"
                        : "text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {mode === "all" ? "All Experiences" : "Hosted by Me"}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-300/70">
                {isAdmin
                  ? "Host view gives you full control over premium experiences you curate."
                  : "Create an event to join our network of premium hosts."}
              </p>
              <div className="mt-6">
                <Link
                  href={isAdmin ? "/create" : "/"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.36)]"
                >
                  <Crown className="h-4 w-4" strokeWidth={1.8} />
                  {isAdmin
                    ? "Plan a Signature Event"
                    : "Explore Premium Highlights"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6 animate-fade-up animation-delay-1">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-5 sm:px-7 sm:py-6">
          <div>
            <h2 className="text-xl font-semibold text-white md:text-2xl">
              Presents tailored for{" "}
              {viewMode === "mine" ? "your guests" : "your audience"}
            </h2>
            <p className="text-sm text-slate-300/80">
              {timeframeInfo[timeframe].subtitle}
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={`event-skeleton-${idx}`}
                className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.45)]"
              >
                <div className="relative h-40 overflow-hidden rounded-2xl bg-white/5">
                  <span
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    style={{ animation: "shimmer 2.4s linear infinite" }}
                  />
                </div>
                <div className="mt-6 h-4 w-3/4 rounded bg-white/10" />
                <div className="mt-3 h-3 w-2/3 rounded bg-white/10" />
                <div className="mt-8 h-10 rounded-xl bg-white/10" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 px-8 py-14 text-center text-slate-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-2xl">
              <EmptyIcon
                className="h-6 w-6 text-indigo-200"
                strokeWidth={1.8}
              />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-white">
              No events in this view yet
            </h3>
            <p className="mt-2 text-sm text-slate-300/80">
              {viewMode === "mine"
                ? "Craft a signature experience and we'll showcase it here."
                : "Adjust your timeframe or check back as our curators add new highlights."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {events.map((event, index) => (
              <div
                key={event._id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <EventCard event={event} isAdmin={isAdmin ?? false} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
