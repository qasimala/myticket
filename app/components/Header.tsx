"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  ChevronDown,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import AuthDialog from "./AuthDialog";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const currentUser = useQuery(api.users.current);
  const cartCount = useQuery(api.cart.getCartCount);
  const { signOut } = useAuthActions();

  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAdmin =
    currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin");

  return (
    <>
      <header className="relative sticky top-0 z-40 border-b border-white/10 bg-slate-950/60 backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-70" />
          <div className="absolute -top-32 left-1/2 h-32 w-[65%] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500/15 via-transparent to-purple-500/15 blur-3xl" />
        </div>

        <div className="relative mx-auto flex h-20 w-full max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <button
            onClick={onMenuClick}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/20 hover:bg-white/10 lg:hidden animate-fade-up"
          >
            <Menu className="h-5 w-5" strokeWidth={1.8} />
          </button>

          <div className="hidden flex-col gap-1 sm:flex animate-fade-up animation-delay-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.45em] text-slate-300/80">
              <Sparkles className="h-3.5 w-3.5 text-indigo-200" strokeWidth={1.8} />
              Experience Control
            </span>
            <h1 className="text-xl font-semibold text-slate-100">
              Curate moments that matter
            </h1>
          </div>

          <div className="ml-auto flex flex-1 items-center justify-end gap-4">
            <div className="hidden lg:flex lg:flex-1 lg:justify-center">
              <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_18px_45px_rgba(15,23,42,0.35)] animate-fade-up animation-delay-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.6}
                />
                <input
                  type="search"
                  placeholder="Search headliners, venues, or hosts..."
                  className="w-full bg-transparent py-3 pl-10 pr-20 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                />
                <div className="pointer-events-none absolute inset-y-2 right-2 hidden items-center rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-medium text-slate-300/70 sm:flex">
                  Ctrl&nbsp;K
                </div>
              </div>
            </div>

            <ThemeToggle />

            {currentUser && (
              <Link
                href="/cart"
                className="relative hidden h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10 sm:flex animate-fade-up animation-delay-2"
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.7} />
                <span className="hidden sm:inline">Cart</span>
                {cartCount && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-[#483d8b] to-[#6a5acd] text-[11px] font-bold text-white shadow-lg shadow-[0_18px_45px_rgba(72,61,139,0.28)]">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/create"
                className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_65px_rgba(72,61,139,0.36)] sm:flex animate-fade-up animation-delay-2"
              >
                <Sparkles className="h-4 w-4" strokeWidth={1.8} />
                Launch Event
              </Link>
            )}

            {currentUser ? (
              <div className="relative animate-fade-up animation-delay-3">
                <button
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:border-white/20 hover:bg-white/10"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-semibold text-white">
                    {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
                  </span>
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-semibold text-white">
                      {currentUser.name || "User"}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                      {currentUser.role}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition ${showUserMenu ? "rotate-180" : ""}`}
                    strokeWidth={1.8}
                  />
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-60" />
                      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-semibold text-white">
                          {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {currentUser.name || "User"}
                          </p>
                          <p className="text-xs text-slate-300">{currentUser.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          signOut();
                          setShowUserMenu(false);
                        }}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-white/10"
                      >
                        <LogOut className="h-4 w-4" strokeWidth={1.8} />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthDialog(true)}
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10 animate-fade-up animation-delay-3"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {showAuthDialog && <AuthDialog onClose={() => setShowAuthDialog(false)} />}
    </>
  );
}
