"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { FormEvent, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface TicketManagerProps {
  eventId: Id<"events">;
}

export default function TicketManager({ eventId }: TicketManagerProps) {
  const tickets = useQuery(api.tickets.listByEvent, { eventId });
  const createTicket = useMutation(api.tickets.create);
  const removeTicket = useMutation(api.tickets.remove);
  const sellTicket = useMutation(api.tickets.sell);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.quantity) return;

    await createTicket({
      eventId,
      name: formData.name,
      description: formData.description,
      price: Math.round(parseFloat(formData.price) * 100), // Convert to cents
      quantity: parseInt(formData.quantity),
    });

    setFormData({ name: "", description: "", price: "", quantity: "" });
    setShowForm(false);
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const handleSellTicket = async (ticketId: Id<"tickets">) => {
    const quantity = prompt("How many tickets to sell?", "1");
    if (quantity) {
      try {
        await sellTicket({ id: ticketId, quantity: parseInt(quantity) });
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-semibold">Ticket Types</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Ticket Type"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Ticket name (e.g., General Admission)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price ($)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <input
              type="text"
              placeholder="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              placeholder="Quantity available"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Create Ticket Type
          </button>
        </form>
      )}

      <div className="space-y-3">
        {tickets === undefined ? (
          <p className="text-gray-500">Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No ticket types yet. Add one above!
          </p>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket._id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h5 className="font-semibold text-lg">{ticket.name}</h5>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      ticket.status === "sold_out"
                        ? "bg-red-100 text-red-800"
                        : ticket.status === "available"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {ticket.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{ticket.description}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="font-semibold text-green-600">
                    {formatPrice(ticket.price)}
                  </span>
                  <span className="text-gray-600">
                    Sold: {ticket.sold} / {ticket.quantity}
                  </span>
                  <span className="text-gray-600">
                    Available: {ticket.quantity - ticket.sold}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSellTicket(ticket._id)}
                  disabled={ticket.sold >= ticket.quantity}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Sell
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Delete ticket type "${ticket.name}"? This cannot be undone.`
                      )
                    ) {
                      removeTicket({ id: ticket._id });
                    }
                  }}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

