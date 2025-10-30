"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { api } from "../../convex/_generated/api";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const cart = useQuery(api.cart.getCart);

  const cartItems = Array.isArray(cart) ? cart : [];
  const hasItems = cartItems.length > 0;
  const totalItems = cartItems.reduce(
    (sum: number, item: any) => sum + (item?.quantity ?? 0),
    0
  );
  const totalPrice = cartItems.reduce(
    (sum: number, item: any) =>
      sum + ((item?.ticket?.price ?? 0) * (item?.quantity ?? 0)),
    0
  );

  const formatPrice = (priceInCents: number) =>
    `$${(priceInCents / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-col min-h-screen lg:ml-64">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page content */}
        <main
          className={`flex-1 overflow-auto ${
            hasItems ? "pb-24 lg:pb-28" : ""
          }`}
        >
          {children}
        </main>
      </div>

      {hasItems && (
        <div className="fixed inset-x-0 bottom-0 z-50 lg:pl-64">
          <div className="bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 lg:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-gray-500">Cart Summary</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {totalItems} {totalItems === 1 ? "item" : "items"} •{" "}
                    {formatPrice(totalPrice)}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/cart"
                    className="text-center px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                  >
                    View Cart
                  </Link>
                  <Link
                    href="/checkout"
                    className="text-center px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

