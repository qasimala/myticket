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
    customerEmail: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Prefill email when user data loads
  useEffect(() => {
    if (currentUser?.email) {
      setFormData((prev) => ({
        ...prev,
        customerEmail: prev.customerEmail || currentUser.email || "",
      }));
    }
  }, [currentUser?.email]);

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
        <div className="p-6 lg:p-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Sign In Required
            </h3>
            <p className="text-gray-600">
              Please sign in to complete your purchase
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (cart === undefined) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded w-1/4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (cart.length === 0) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-600 mb-6">
              Add some tickets to your cart before checking out
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              Browse Events
            </Link>
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

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="mb-6">
            <Link
              href="/cart"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
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
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600 mt-1">
              Enter your details to proceed to secure payment
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Contact Information
                  </h2>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.customerEmail}
                      onChange={(e) =>
                        setFormData({
                          customerEmail: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Booking confirmation will be sent to this email
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Proceed to Payment"}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div
                      key={item._id}
                      className="border-b border-gray-200 pb-4"
                    >
                      <div className="text-sm font-semibold text-gray-900">
                        {item.event.name}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {item.ticket.name} × {item.quantity}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mt-1">
                        {formatPrice(item.ticket.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Total Items</span>
                    <span>{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
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

