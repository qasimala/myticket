"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Crown,
  PlusSquare,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { api } from "../../convex/_generated/api";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type NavItem = {
  name: string;
  path: string;
  description: string;
  icon: LucideIcon;
  requireAuth?: boolean;
  requireAdmin?: boolean;
};

const coreItems: NavItem[] = [
  {
    name: "Discover",
    path: "/",
    icon: Sparkles,
    description: "Curated experiences & highlights",
  },
  {
    name: "My Bookings",
    path: "/my-bookings",
    icon: CalendarDays,
    description: "Manage your reservations",
    requireAuth: true,
  },
  {
    name: "My Events",
    path: "/my-events",
    icon: Crown,
    description: "Control the events you host",
    requireAdmin: true,
  },
  {
    name: "Create Event",
    path: "/create",
    icon: PlusSquare,
    description: "Launch a new luxury experience",
    requireAdmin: true,
  },
];

const adminItems: NavItem[] = [
  {
    name: "Admin Console",
    path: "/admin",
    icon: ShieldCheck,
    description: "Governance, access & roles",
    requireAdmin: true,
  },
  {
    name: "Ticket Scanner",
    path: "/admin/scan",
    icon: QrCode,
    description: "Validate live entry QR codes",
    requireAdmin: true,
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const currentUser = useQuery(api.users.current);

  const isActive = (path: string) => pathname === path;
  const isAdmin =
    currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin");

  const renderLink = (item: NavItem, index: number) => {
    if (item.requireAdmin && !isAdmin) return null;
    if (item.requireAuth && !currentUser) return null;

    const active = isActive(item.path);
    const Icon = item.icon;

    return (
      <Link
        key={item.path}
        href={item.path}
        onClick={onClose}
        className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
          active
            ? "bg-gradient-to-r from-white/10 to-white/5 text-white shadow-[0_16px_38px_rgba(79,70,229,0.35)]"
            : "text-slate-200 hover:bg-white/8"
        } animate-fade-up`}
        style={{ animationDelay: `${0.08 * index}s` }}
      >
        <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md transition group-hover:border-white/20">
          <span className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
          <Icon
            className={`h-5 w-5 ${active ? "text-white" : "text-slate-200/80"}`}
            strokeWidth={1.6}
          />
        </span>
        <div className="flex-1">
          <div className="text-sm font-semibold tracking-wide">{item.name}</div>
          <div className="text-xs text-slate-300/70">{item.description}</div>
        </div>
        {active && (
          <>
            <span className="absolute inset-0 rounded-xl border border-white/15 opacity-0 transition group-hover:opacity-100" />
            <span className="absolute -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500/40 via-sky-400/40 to-transparent blur-xl" />
          </>
        )}
      </Link>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-72 transform border-r border-white/10 bg-white/[0.04] backdrop-blur-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-70" />
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-6 pb-6 pt-8">
            <Link
              href="/"
              className="group flex items-center gap-3"
              onClick={onClose}
            >
              <div className="relative flex h-11 w-11 items-center justify-center">
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 opacity-80 blur-md transition group-hover:opacity-100" />
                <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950/80 text-lg font-semibold text-white shadow-lg shadow-[0_18px_45px_rgba(72,61,139,0.26)]">
                  MT
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-300">
                  MyTicket
                </p>
                <p className="text-xs text-slate-400">
                  Curating premium experiences
                </p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-2">
              <p className="px-4 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400/80">
                Journey
              </p>
              <div className="mt-3 space-y-2.5">
                {coreItems.map((item, index) => renderLink(item, index))}
              </div>
            </div>

            {isAdmin && (
              <div className="mt-8 space-y-2">
                <p className="px-4 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400/80">
                  Command
                </p>
                <div className="mt-3 space-y-2.5">
                  {adminItems.map((item, index) =>
                    renderLink(item, coreItems.length + index)
                  )}
                </div>
              </div>
            )}
          </nav>

          {currentUser && (
            <div className="border-t border-white/10 px-4 py-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl animate-fade-up animation-delay-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-semibold text-white">
                    {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {currentUser.name || "User"}
                    </p>
                    <p className="text-xs text-slate-300/80">{currentUser.role}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
