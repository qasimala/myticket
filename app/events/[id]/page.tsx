"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import MainLayout from "../../components/MainLayout";
import Link from "next/link";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const eventId = id as Id<"events">;
  const event = useQuery(api.events.get, { id: eventId });
  const tickets = useQuery(api.tickets.listByEvent, { eventId });
  const currentUser = useQuery(api.users.current);
  const addToCart = useMutation(api.cart.addToCart);
  const [activeSection, setActiveSection] = useState<"tickets" | "about" | "accessibility" | "faqs">("tickets");
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  if (event === undefined || tickets === undefined) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Event Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              The event you're looking for doesn't exist
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 border-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const totalTickets = tickets.reduce((sum, t) => sum + t.quantity, 0);
  const soldTickets = tickets.reduce((sum, t) => sum + t.sold, 0);
  const availableTickets = totalTickets - soldTickets;

  let faqs: Array<{ question: string; answer: string }> = [];
  try {
    faqs = event.faqs ? JSON.parse(event.faqs) : [];
  } catch (e) {
    console.error("Failed to parse FAQs", e);
  }

  const handleAddToCart = async (ticketId: Id<"tickets">) => {
    const quantity = ticketQuantities[ticketId] || 1;
    setAddingToCart(ticketId);
    try {
      await addToCart({ ticketId, quantity });
      setTicketQuantities({ ...ticketQuantities, [ticketId]: 1 });
      // Show success feedback (you could add a toast notification here)
    } catch (err: any) {
      alert(err.message || "Failed to add to cart");
    } finally {
      setAddingToCart(null);
    }
  };

  const getQuantity = (ticketId: string) => ticketQuantities[ticketId] || 1;

  const updateQuantity = (ticketId: string, change: number) => {
    const current = getQuantity(ticketId);
    const newQuantity = Math.max(1, current + change);
    setTicketQuantities({ ...ticketQuantities, [ticketId]: newQuantity });
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-indigo-600 mb-6 font-medium transition-colors"
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
          Back to Events
        </Link>

        {/* Hero Section with Event Image and Basic Details */}
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {event.imageUrl && (
            <div className="relative h-96 w-full">
              <img
                src={event.imageUrl}
                alt={event.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 ${getStatusColor(
                      event.status
                    )}`}
                  >
                    {event.status.toUpperCase()}
                  </span>
                </div>
                <h1 className="text-5xl font-bold mb-3 drop-shadow-lg">
                  {event.name}
                </h1>
                <p className="text-xl text-gray-100 drop-shadow-md max-w-3xl">
                  {event.description}
                </p>
              </div>
            </div>
          )}

          {!event.imageUrl && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 ${getStatusColor(
                    event.status
                  )}`}
                >
                  {event.status.toUpperCase()}
                </span>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-3">
                {event.name}
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                {event.description}
              </p>
            </div>
          )}

          {/* Quick Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 p-8 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-start gap-4 p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-4xl">📅</div>
              <div>
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Date & Time
                </div>
                <div className="text-gray-900 font-medium">{formatDate(event.date)}</div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-4xl">📍</div>
              <div>
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Location
                </div>
                <div className="text-gray-900 font-medium">{event.location}</div>
                <div className="text-sm text-gray-600">{event.city}, {event.country}</div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-4xl">🎫</div>
              <div>
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Availability
                </div>
                <div className="text-gray-900 font-medium">
                  {availableTickets} / {totalTickets} tickets
                </div>
                <div className="text-sm text-gray-600">
                  {soldTickets} sold
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="bg-white rounded-xl shadow-md p-2 mb-8 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSection("tickets")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeSection === "tickets"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            🎫 Tickets
          </button>
          <button
            onClick={() => setActiveSection("about")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeSection === "about"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            📝 About
          </button>
          <button
            onClick={() => setActiveSection("accessibility")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeSection === "accessibility"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            ♿ Accessibility
          </button>
          <button
            onClick={() => setActiveSection("faqs")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeSection === "faqs"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            ❓ FAQs
          </button>
        </div>

        {/* Content Sections */}
        <div className="bg-white rounded-xl shadow-md p-8">
          {/* Tickets Section */}
          {activeSection === "tickets" && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Available Tickets</h2>

              {tickets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🎫</div>
                  <p className="text-lg">No ticket types available yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => {
                    const availableCount = ticket.quantity - ticket.sold;
                    const quantity = getQuantity(ticket._id);
                    const isAvailable = ticket.status === "available" && availableCount > 0;

                    return (
                      <div
                        key={ticket._id}
                        className="border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-400 hover:shadow-lg transition-all"
                      >
                        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                          <div className="flex-1 w-full">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-2xl font-bold text-gray-900">
                                {ticket.name}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                  ticket.status === "sold_out"
                                    ? "bg-red-100 text-red-800"
                                    : ticket.status === "available"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {ticket.status === "sold_out"
                                  ? "Sold Out"
                                  : ticket.status === "available"
                                  ? "Available"
                                  : "Hidden"}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-4 text-lg">{ticket.description}</p>
                            <div className="flex items-center gap-8">
                              <div>
                                <div className="text-sm text-gray-500 font-semibold mb-1">Available</div>
                                <div className="text-2xl font-bold text-gray-900">
                                  {availableCount}
                                  <span className="text-sm text-gray-500 font-normal"> / {ticket.quantity}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500 font-semibold mb-1">Sold</div>
                                <div className="text-2xl font-bold text-indigo-600">{ticket.sold}</div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right w-full lg:w-auto">
                            <div className="text-4xl font-bold text-indigo-600 mb-4">
                              {formatPrice(ticket.price)}
                            </div>
                            
                            {currentUser && isAvailable ? (
                              <div className="space-y-3">
                                {/* Quantity Selector */}
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => updateQuantity(ticket._id, -1)}
                                    disabled={quantity <= 1}
                                    className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                                  >
                                    −
                                  </button>
                                  <span className="w-12 text-center font-bold text-lg">
                                    {quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(ticket._id, 1)}
                                    disabled={quantity >= availableCount}
                                    className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Add to Cart Button */}
                                <button
                                  onClick={() => handleAddToCart(ticket._id)}
                                  disabled={addingToCart === ticket._id}
                                  className="w-full px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {addingToCart === ticket._id ? "Adding..." : "Add to Cart"}
                                </button>
                              </div>
                            ) : !currentUser && isAvailable ? (
                              <div className="text-center">
                                <Link
                                  href="/"
                                  className="inline-block px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                                >
                                  Sign in to Book
                                </Link>
                              </div>
                            ) : (
                              <div className="px-8 py-3 bg-red-100 text-red-700 rounded-lg font-semibold text-center">
                                Sold Out
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* About Section */}
          {activeSection === "about" && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Event</h2>
              {event.about ? (
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{event.about}</p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-lg">No additional information available</p>
                </div>
              )}
            </div>
          )}

          {/* Accessibility Section */}
          {activeSection === "accessibility" && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Accessibility Information</h2>
              {event.accessibility ? (
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{event.accessibility}</p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">♿</div>
                  <p className="text-lg">No accessibility information available</p>
                  <p className="text-sm mt-2">Contact the organizers for specific accessibility questions</p>
                </div>
              )}
            </div>
          )}

          {/* FAQs Section */}
          {activeSection === "faqs" && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              {faqs.length > 0 ? (
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        Q: {faq.question}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        A: {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">❓</div>
                  <p className="text-lg">No FAQs available yet</p>
                  <p className="text-sm mt-2">Check back later for answers to common questions</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
