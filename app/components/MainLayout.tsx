"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import Sidebar from "./Sidebar";
import BottomNavigation from "./BottomNavigation";
import OfflineIndicator from "./OfflineIndicator";
import { api } from "../../convex/_generated/api";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const cart = useQuery(api.cart.getCart);

  const cartItems = Array.isArray(cart) ? cart : [];
  const hasItems = cartItems.length > 0;
  const isCheckoutPage = pathname === "/checkout";
  const totalItems = cartItems.reduce(
    (sum: number, item: any) => sum + (item?.quantity ?? 0),
    0
  );
  const totalPrice = cartItems.reduce(
    (sum: number, item: any) =>
      sum + (item?.ticket?.price ?? 0) * (item?.quantity ?? 0),
    0
  );

  const formatPrice = (priceInCents: number) =>
    `$${(priceInCents / 100).toFixed(2)}`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 transition-colors duration-300">
      <OfflineIndicator />
      <div className="aurora-blob aurora-blob--indigo -top-56 -left-24" />
      <div className="aurora-blob aurora-blob--purple top-1/3 -right-48" />
      <div className="aurora-blob aurora-blob--teal top-[65%] -left-40" />
      <div className="home-hero-ambient" />
      <div className="grid-overlay" />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 flex min-h-screen lg:pl-72">
        <div className="flex w-full flex-col">
          <main
            className={`flex-1 overflow-x-hidden ${
              hasItems && !isCheckoutPage ? "pb-28 lg:pb-32" : "pb-20 lg:pb-14"
            }`}
          >
            <div className="relative mx-auto w-full px-4 pb-12 pt-10 sm:px-6 lg:px-8 xl:px-12">
              <div className="relative animate-fade-in">{children}</div>
            </div>
          </main>
        </div>
      </div>

      {hasItems && !isCheckoutPage && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-20 lg:pb-5 lg:pl-[calc(18rem+1.25rem)]">
          <div className="pointer-events-auto overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-[0_28px_70px_rgba(15,23,42,0.55)] backdrop-blur-xl animate-fade-up">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-70" />
            <div className="px-5 py-5 lg:px-8 lg:py-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Cart Snapshot
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white md:text-xl">
                    {totalItems}{" "}
                    {totalItems === 1 ? "ticket reserved" : "tickets reserved"}{" "}
                    |{" "}
                    <span className="text-indigo-300">
                      {formatPrice(totalPrice)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/cart"
                    className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/40 hover:bg-white/10"
                  >
                    View Cart
                  </Link>
                  <Link
                    href="/checkout"
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.32)]"
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
    </div>
  );
}
