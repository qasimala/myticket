"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
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
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/50 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <button
            onClick={onMenuClick}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/20 hover:bg-white/10 lg:hidden"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden flex-col sm:flex">
            <p className="text-[11px] font-semibold uppercase tracking-[0.5em] text-slate-400">
              Experience Control
            </p>
            <h1 className="text-xl font-semibold text-slate-100">
              Curate moments that matter
            </h1>
          </div>

          <div className="ml-auto flex flex-1 items-center justify-end gap-4">
            <div className="hidden lg:flex lg:flex-1 lg:justify-center">
              <div className="relative w-full max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35M9.75 17.5a7.75 7.75 0 1 1 0-15.5 7.75 7.75 0 0 1 0 15.5z"
                    />
                  </svg>
                </div>
                <input
                  type="search"
                  placeholder="Search headliners, venues, or hosts…"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-slate-100 transition focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>
            </div>

            <ThemeToggle />

            {currentUser && (
              <Link
                href="/cart"
                className="relative hidden h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10 sm:flex"
              >
                <span className="mr-2 text-base">🛍️</span>
                <span className="hidden sm:inline">Cart</span>
                {cartCount && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-[11px] font-bold text-white shadow-lg shadow-indigo-500/30">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/create"
                className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_18px_45px_rgba(99,102,241,0.35)] transition hover:shadow-[0_22px_65px_rgba(99,102,241,0.45)] sm:flex"
              >
                Launch Event
              </Link>
            )}

            {currentUser ? (
              <div className="relative">
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
                  <svg
                    className={`h-4 w-4 text-slate-400 transition ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 z-50 mt-3 w-64 rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.45)] backdrop-blur-xl">
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
                        className="mt-3 w-full rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-white/10"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthDialog(true)}
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
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
