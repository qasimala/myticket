"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import MainLayout from "../components/MainLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";

export default function CheckoutPage() {
  const currentUser = useQuery(api.users.current);
  const cart = useQuery(api.cart.getCart);
  const checkout = useMutation(api.bookings.checkout);
  const router = useRouter();

  const [formData, setFormData] = useState({
    customerName: "",
    customerId: "",
    customerPhone: "",
    customerEmail: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Prefill form data when user data loads
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        customerName: prev.customerName || currentUser.name || "",
        customerId: prev.customerId || currentUser.id || "",
        customerPhone: prev.customerPhone || currentUser.phone || "",
        customerEmail: prev.customerEmail || currentUser.email || "",
      }));
    }
  }, [currentUser]);

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsProcessing(true);

    try {
      // Create bookings first (with pending payment status)
      const bookingIds = await checkout({
        customerName: formData.customerName,
        customerId: formData.customerId || undefined,
        customerPhone: formData.customerPhone || undefined,
        customerEmail: formData.customerEmail,
      });

      // Redirect to payment page with first booking ID
      router.push(`/payment/${bookingIds[0]}`);
    } catch (err: any) {
      setError(err.message || "Failed to complete checkout");
      setIsProcessing(false);
    }
  };

  if (!currentUser) {
    return (
      <MainLayout>
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-10 py-16 text-center text-red-100 shadow-xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-200">
            🔒
          </div>
          <h3 className="text-2xl font-semibold">Sign In Required</h3>
          <p className="mt-3 text-sm text-red-100/80">
            Please sign in to complete your purchase
          </p>
        </div>
      </MainLayout>
    );
  }

  if (cart === undefined) {
    return (
      <MainLayout>
        <div className="space-y-5">
          <div className="h-8 w-60 animate-pulse rounded-full bg-white/10" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (cart.length === 0) {
    return (
      <MainLayout>
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 px-12 py-16 text-center shadow-lg">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-indigo-300">
            🛒
          </div>
          <h3 className="text-2xl font-semibold text-slate-50">
            Your cart is empty
          </h3>
          <p className="mt-3 text-sm text-slate-400 mb-6">
            Add some tickets to your cart before checking out
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.36)]"
          >
            Browse Events
          </Link>
        </div>
      </MainLayout>
    );
  }

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.ticket.price * item.quantity,
    0
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="mb-6">
          <Link
            href="/cart"
            className="inline-flex items-center text-indigo-300 hover:text-indigo-200 mb-4 transition"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-slate-50">Checkout</h1>
          <p className="text-slate-400 mt-1">
            Enter your details to proceed to secure payment
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            {/* Warning if profile is incomplete */}
            {currentUser &&
              (!currentUser.name || !currentUser.id || !currentUser.phone) && (
                <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/20 p-4">
                  <p className="text-sm text-yellow-200">
                    ⚠️ Your profile is incomplete. Fields will be prefilled if
                    available. You can{" "}
                    <Link
                      href="/profile"
                      className="underline font-semibold text-yellow-100 hover:text-yellow-50"
                    >
                      update your profile
                    </Link>{" "}
                    to speed up future checkouts.
                  </p>
                </div>
              )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-50 mb-4">
                  Contact Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-white/10 bg-white/5 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      ID Number *
                    </label>
                    <input
                      type="text"
                      placeholder="1234567890"
                      value={formData.customerId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-white/10 bg-white/5 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="+1234567890"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerPhone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-white/10 bg-white/5 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.customerEmail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerEmail: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-white/10 bg-white/5 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 transition"
                      required
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Booking confirmation will be sent to this email
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/20 p-4">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 bg-gradient-to-r from-[#483d8b] to-[#6a5acd] text-white rounded-xl hover:shadow-[0_22px_55px_rgba(72,61,139,0.36)] transition-all font-semibold text-lg shadow-[0_18px_45px_rgba(72,61,139,0.28)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Processing..." : "Proceed to Payment"}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-slate-50 mb-4">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div
                      key={item._id}
                      className="border-b border-white/10 pb-4"
                    >
                      <div className="text-sm font-semibold text-slate-100">
                        {item.event.name}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        {item.ticket.name} × {item.quantity}
                      </div>
                      <div className="text-sm font-semibold text-indigo-300 mt-1">
                        {formatPrice(item.ticket.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Items</span>
                    <span>{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-slate-50">
                    <span>Total</span>
                    <span className="text-indigo-300">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg border border-indigo-500/30 bg-indigo-500/20">
                  <p className="text-xs text-indigo-200">
                    🔒 Secure payment powered by PeachPayments. Your payment
                    details are encrypted and secure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
