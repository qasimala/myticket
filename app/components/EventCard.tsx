"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import TicketManager from "./TicketManager";
import type { Doc } from "../../convex/_generated/dataModel";

interface EventCardProps {
  event: Doc<"events">;
  isAdmin?: boolean;
}

const statusStyles: Record<string, { label: string; className: string }> = {
  published: {
    label: "Live",
    className:
      "from-emerald-400/80 via-emerald-500/60 to-emerald-400/40 text-emerald-50",
  },
  draft: {
    label: "Draft",
    className:
      "from-amber-400/80 via-amber-500/50 to-amber-400/40 text-amber-50",
  },
  cancelled: {
    label: "Cancelled",
    className: "from-rose-400/80 via-rose-500/50 to-rose-400/40 text-rose-50",
  },
};

const infoIcon = (path: string) => (
  <svg
    className="h-4 w-4 text-slate-200/80"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

export default function EventCard({ event, isAdmin = false }: EventCardProps) {
  const [showTickets, setShowTickets] = useState(false);
  const tickets = useQuery(api.tickets.listByEvent, { eventId: event._id });
  const publishEvent = useMutation(api.events.publish);
  const updateEvent = useMutation(api.events.update);
  const removeEvent = useMutation(api.events.remove);

  const totalTickets =
    tickets?.reduce((sum, ticket) => sum + ticket.quantity, 0) ?? 0;
  const soldTickets =
    tickets?.reduce((sum, ticket) => sum + ticket.sold, 0) ?? 0;
  const occupancy =
    totalTickets === 0
      ? 0
      : Math.min(100, Math.round((soldTickets / totalTickets) * 100));

  const statusStyle = statusStyles[event.status] ?? {
    label: event.status,
    className:
      "from-slate-400/70 via-slate-500/50 to-slate-400/30 text-slate-100",
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-[1px] transition duration-300 hover:border-white/20">
      <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-white/10 via-white/0 to-white/10 opacity-0 transition group-hover:opacity-100" />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[1.7rem] bg-slate-950/60 backdrop-blur-xl">
        <div className="relative h-44 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-purple-500/10 to-transparent" />
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.name}
              className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/40 via-purple-500/20 to-indigo-900/40" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 via-slate-950/0 to-transparent" />
          <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-white/80 backdrop-blur">
            Elite
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="absolute right-6 top-6 rounded-xl border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
            {formatDate(event.date).split(",")[0]}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 p-6 sm:p-7 lg:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-white sm:text-2xl lg:text-2xl">
                {event.name}
              </h3>
              <p className="mt-2 text-sm text-slate-300/80 line-clamp-2 lg:text-base">
                {event.description}
              </p>
            </div>
            <div
              className={`rounded-xl bg-gradient-to-br px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.45em] ${statusStyle.className}`}
            >
              {statusStyle.label}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm text-slate-200/90">
            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5">
              {infoIcon(
                "M8 7V5a4 4 0 1 1 8 0v2m-9 4h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9.5l-2.3-2.3A1 1 0 0 0 6.5 20H6a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z"
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400 mb-1">
                  Date
                </p>
                <p className="text-sm lg:text-base">{formatDate(event.date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5">
              {infoIcon(
                "M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3zm0 0c-3.866 0-7 1.79-7 4v1.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15c0-2.21-3.134-4-7-4z"
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400 mb-1">
                  Location
                </p>
                <p className="text-sm lg:text-base line-clamp-2">
                  {event.location}, {event.city}, {event.country}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3.5">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">
                <span>Occupancy</span>
                <span className="text-slate-200 font-semibold">
                  {soldTickets} / {totalTickets}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#483d8b] to-[#6a5acd]"
                  style={{ width: `${occupancy}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/events/${event._id}`}
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/15"
            >
              View Experience
            </Link>

            {isAdmin && (
              <>
                <Link
                  href={`/events/${event._id}/edit`}
                  className="inline-flex items-center justify-center rounded-xl border border-blue-300/40 bg-blue-400/20 px-4 py-3 text-sm font-semibold text-blue-100 transition hover:bg-blue-400/30"
                >
                  Edit Event
                </Link>
                <button
                  onClick={() => setShowTickets((prev) => !prev)}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#483d8b]/85 to-[#6a5acd]/85 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.32)]"
                >
                  {showTickets ? "Hide Ticketing" : "Ticketing Suite"}
                </button>

                {event.status === "draft" && (
                  <button
                    onClick={() => publishEvent({ id: event._id })}
                    className="inline-flex items-center justify-center rounded-xl border border-emerald-300/40 bg-emerald-400/20 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/30"
                  >
                    Publish Event
                  </button>
                )}

                {event.status === "published" && (
                  <button
                    onClick={() =>
                      updateEvent({ id: event._id, status: "cancelled" })
                    }
                    className="inline-flex items-center justify-center rounded-xl border border-amber-300/40 bg-amber-400/20 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/30"
                  >
                    Pause Event
                  </button>
                )}

                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Are you sure you want to delete "${event.name}"?`
                      )
                    ) {
                      removeEvent({ id: event._id });
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-xl border border-rose-300/40 bg-rose-400/20 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/30"
                >
                  Delete
                </button>
              </>
            )}
          </div>

          {isAdmin && showTickets && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <TicketManager eventId={event._id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
