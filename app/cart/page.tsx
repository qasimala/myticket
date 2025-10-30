"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import MainLayout from "../components/MainLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  LockKeyhole,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  TicketIcon,
  Trash2,
} from "lucide-react";

export default function CartPage() {
  const currentUser = useQuery(api.users.current);
  const cart = useQuery(api.cart.getCart);
  const removeFromCart = useMutation(api.cart.removeFromCart);
  const updateCartItem = useMutation(api.cart.updateCartItem);
  const router = useRouter();

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (currentUser === undefined) {
    return (
      <MainLayout>
        <div className="space-y-5">
          <div className="h-8 w-60 animate-pulse rounded-full bg-white/10" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
              <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!currentUser) {
    return (
      <MainLayout>
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-10 py-16 text-center text-red-100 shadow-xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-200">
            <LockKeyhole className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-semibold">Sign In Required</h3>
          <p className="mt-3 text-sm text-red-100/80">
            Please sign in to manage your cart and continue to checkout.
          </p>
        </div>
      </MainLayout>
    );
  }

  if (cart === undefined) {
    return (
      <MainLayout>
        <div className="space-y-5">
          <div className="h-8 w-56 animate-pulse rounded-full bg-white/10" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
              <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
          </div>
        </div>
      </MainLayout>
    );
  }

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.ticket.price * item.quantity,
    0
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const CartHeader = () => (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold text-slate-50">Shopping Cart</h1>
      <p className="text-slate-400">
        {totalItems} {totalItems === 1 ? "ticket reserved" : "tickets reserved"} ·{" "}
        <span className="text-indigo-300">{formatPrice(totalPrice)}</span>
      </p>
    </div>
  );

  if (cart.length === 0) {
    return (
      <MainLayout>
        <CartHeader />
        <div className="mt-8 rounded-3xl border border-white/10 bg-slate-900/80 px-12 py-16 text-center shadow-lg">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-indigo-300">
            <ShoppingCart className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-semibold text-slate-50">
            Your cart is empty
          </h3>
          <p className="mt-3 text-sm text-slate-400">
            Discover upcoming events and add tickets to build your experience.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.36)]"
          >
            Browse Events
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <CartHeader />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => {
              const maxAvailable = item.ticket.quantity - item.ticket.sold;
              const canIncrease = item.quantity < maxAvailable;

              return (
                <div
                  key={item._id}
                  className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg transition hover:border-white/20 hover:shadow-xl"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    <div className="flex-1 space-y-4">
                      <div>
                        <Link
                          href={`/events/${item.event._id}`}
                          className="text-sm font-semibold text-indigo-300 hover:text-indigo-200"
                        >
                          {item.event.name}
                        </Link>

                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(item.event.date)}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {item.event.city}, {item.event.country}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-slate-100">
                          <TicketIcon className="h-4 w-4 text-indigo-300" />
                          <h3 className="text-lg font-semibold">
                            {item.ticket.name}
                          </h3>
                        </div>
                        {item.ticket.description && (
                          <p className="mt-2 text-sm text-slate-400">
                            {item.ticket.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/5">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateCartItem({
                                  cartItemId: item._id,
                                  quantity: item.quantity - 1,
                                });
                              }
                            }}
                            disabled={item.quantity <= 1}
                            className="flex h-10 w-10 items-center justify-center border-r border-white/10 text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center text-sm font-semibold text-slate-100">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              if (canIncrease) {
                                updateCartItem({
                                  cartItemId: item._id,
                                  quantity: item.quantity + 1,
                                });
                              }
                            }}
                            disabled={!canIncrease}
                            className="flex h-10 w-10 items-center justify-center border-l border-white/10 text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart({ cartItemId: item._id })}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>

                        {!canIncrease && (
                          <span className="text-xs text-yellow-200">
                            Maximum available tickets reached
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="min-w-[180px] rounded-2xl border border-white/10 bg-white/5 p-4 text-right">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Total
                      </div>
                      <div className="mt-2 text-2xl font-bold text-white">
                        {formatPrice(item.ticket.price * item.quantity)}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {formatPrice(item.ticket.price)} each
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-slate-50">
                  Order Summary
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  All taxes included. You will confirm details at checkout.
                </p>

                <div className="mt-6 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Service & platform fees</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 text-base font-semibold text-slate-100">
                    <div className="flex items-center justify-between">
                      <span>Total</span>
                      <span className="text-indigo-300">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/checkout")}
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.36)]"
                >
                  Proceed to Checkout
                </button>

                <Link
                  href="/"
                  className="mt-3 block text-center text-sm font-semibold text-indigo-300 hover:text-indigo-200"
                >
                  Continue browsing events
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
