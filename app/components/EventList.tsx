"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import {
  CalendarDays,
  CalendarX2,
  Clock3,
  Crown,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const allowedView: ViewMode = isAdmin ? viewMode : "all";
  const viewOptions: ViewMode[] = isAdmin ? ["all", "mine"] : ["all"];

  const sourceEvents = allowedView === "mine" ? myEvents : allEvents;
  const eventsLoading = sourceEvents === undefined;

  // Get all tickets to calculate price ranges
  const allTickets = useQuery(api.tickets.list);

  // Get unique cities and price ranges
  const { cities, priceRange } = useMemo(() => {
    const raw = Array.isArray(allEvents) ? allEvents : [];
    const citySet = new Set<string>();
    const prices: number[] = [];

    raw.forEach((event) => {
      if (event.city) citySet.add(event.city);
    });

    const ticketsList = Array.isArray(allTickets) ? allTickets : [];
    ticketsList.forEach((ticket) => {
      if (ticket.price && ticket.status === "available") {
        prices.push(ticket.price);
      }
    });

    return {
      cities: Array.from(citySet).sort(),
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0,
      },
    };
  }, [allEvents, allTickets]);

  const { events, upcomingCount, premiumHosts } = useMemo(() => {
    const now = Date.now();
    const raw = Array.isArray(sourceEvents) ? sourceEvents : [];

    // First filter by timeframe
    let filtered = raw.filter((event) => {
      const eventTime = new Date(event.date).getTime();
      if (Number.isNaN(eventTime)) return timeframe !== "upcoming";
      if (timeframe === "upcoming") return eventTime >= now;
      if (timeframe === "past") return eventTime < now;
      return true;
    });

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((event) => {
        return (
          event.name.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.city.toLowerCase().includes(query)
        );
      });
    }

    // Filter by city
    if (selectedCity) {
      filtered = filtered.filter((event) => event.city === selectedCity);
    }

    // Filter by price range (need to check tickets)
    if (minPrice !== null || maxPrice !== null) {
      const ticketsList = Array.isArray(allTickets) ? allTickets : [];
      filtered = filtered.filter((event) => {
        const eventTickets = ticketsList.filter(
          (t) => t.eventId === event._id && t.status === "available"
        );
        if (eventTickets.length === 0) return false;

        const minTicketPrice = Math.min(...eventTickets.map((t) => t.price));
        const maxTicketPrice = Math.max(...eventTickets.map((t) => t.price));

        if (minPrice !== null && maxTicketPrice < minPrice) return false;
        if (maxPrice !== null && minTicketPrice > maxPrice) return false;
        return true;
      });
    }

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
  }, [
    allEvents,
    sourceEvents,
    timeframe,
    searchQuery,
    selectedCity,
    minPrice,
    maxPrice,
    allTickets,
  ]);

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

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCity !== "" ||
    minPrice !== null ||
    maxPrice !== null;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCity("");
    setMinPrice(null);
    setMaxPrice(null);
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;

  const EmptyIcon = timeframe === "past" ? Clock3 : CalendarX2;

  return (
    <div className="space-y-12">
      {/* Search and Filter Section */}
      <section className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/[0.05] px-6 py-8 shadow-[0_40px_120px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:px-10 lg:px-12 animate-fade-up">
        <div className="absolute -right-40 -top-48 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/40 via-purple-500/35 to-cyan-400/25 blur-3xl" />
        <div className="absolute -bottom-52 -left-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-cyan-400/20 via-teal-400/25 to-transparent blur-[200px]" />
        <div className="absolute inset-0 rounded-[2.75rem] border border-white/5 opacity-40" />

        <div className="relative space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_18px_45px_rgba(15,23,42,0.35)] backdrop-blur-xl">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                strokeWidth={1.6}
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, venues, hosts, or locations..."
                className="w-full bg-transparent py-4 pl-12 pr-4 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
                >
                  <X className="h-4 w-4" strokeWidth={1.8} />
                </button>
              )}
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                showFilters || hasActiveFilters
                  ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-200"
                  : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                  {
                    [searchQuery, selectedCity, minPrice, maxPrice].filter(
                      Boolean
                    ).length
                  }
                </span>
              )}
            </button>

            {/* Quick Filters - City */}
            {cities.length > 0 && (
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pl-10 pr-8 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <MapPin
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.8}
                />
              </div>
            )}

            {/* Timeframe Filters */}
            <div className="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
              {(Object.keys(timeframeLabels) as Timeframe[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setTimeframe(option)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                    timeframe === option
                      ? "bg-white/15 text-white shadow-inner shadow-slate-900/20"
                      : "text-slate-300/80 hover:bg-white/10"
                  }`}
                >
                  {timeframeLabels[option]}
                </button>
              ))}
            </div>

            {/* View Mode (Admin only) */}
            {isAdmin && (
              <div className="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
                {viewOptions.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                      allowedView === mode
                        ? "bg-gradient-to-r from-[#483d8b]/90 to-[#6a5acd]/90 text-white shadow-lg shadow-[0_18px_45px_rgba(72,61,139,0.28)]"
                        : "text-slate-300/80 hover:bg-white/10"
                    }`}
                  >
                    {mode === "all" ? "All" : "Mine"}
                  </button>
                ))}
              </div>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
                Clear
              </button>
            )}
          </div>

          {/* Expanded Filters Panel */}
          {showFilters && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 space-y-4 animate-fade-up">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Price Range
                </h3>
              </div>

              {priceRange.max > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                      Min Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={priceRange.max}
                        value={minPrice ?? ""}
                        onChange={(e) =>
                          setMinPrice(
                            e.target.value
                              ? parseInt(e.target.value) * 100
                              : null
                          )
                        }
                        placeholder={formatPrice(priceRange.min)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-8 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                      Max Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        min={minPrice ?? 0}
                        max={priceRange.max}
                        value={maxPrice ? maxPrice / 100 : ""}
                        onChange={(e) =>
                          setMaxPrice(
                            e.target.value
                              ? parseInt(e.target.value) * 100
                              : null
                          )
                        }
                        placeholder={formatPrice(priceRange.max)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-8 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
