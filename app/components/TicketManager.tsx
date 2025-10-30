"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { FormEvent, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, Trash2, ShoppingCart } from "lucide-react";

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
    <div className="mt-8 pt-8 border-t border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-bold text-slate-50">Manage Ticket Types</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
        >
          <Plus className="h-4 w-4" strokeWidth={1.8} />
          {showForm ? "Cancel" : "Add Ticket Type"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Ticket Name *
              </label>
              <input
                type="text"
                placeholder="e.g., General Admission"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Description
              </label>
              <input
                type="text"
                placeholder="Brief description of this ticket type"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Quantity Available *
              </label>
              <input
                type="number"
                placeholder="100"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                min="1"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#483d8b] to-[#6a5acd] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(72,61,139,0.28)] transition hover:shadow-[0_22px_55px_rgba(72,61,139,0.36)]"
          >
            Create Ticket Type
          </button>
        </form>
      )}

      <div className="space-y-4">
        {tickets === undefined ? (
          <div className="text-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-400/30 border-t-indigo-400 mx-auto"></div>
            <p className="mt-4 text-slate-400">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-white/15 bg-white/5">
            <p className="text-slate-400">
              No ticket types yet. Add one above!
            </p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket._id}
              className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-white/10 bg-slate-900/80 hover:border-white/20 transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h5 className="font-semibold text-lg text-slate-100">
                    {ticket.name}
                  </h5>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      ticket.status === "sold_out"
                        ? "bg-red-500/20 text-red-200"
                        : ticket.status === "available"
                          ? "bg-green-500/20 text-green-200"
                          : "bg-slate-500/20 text-slate-200"
                    }`}
                  >
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>
                {ticket.description && (
                  <p className="text-slate-300 text-sm mb-3">
                    {ticket.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <span className="text-slate-400">Price: </span>
                    <span className="font-semibold text-indigo-400">
                      {formatPrice(ticket.price)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Sold: </span>
                    <span className="font-semibold text-slate-200">
                      {ticket.sold} / {ticket.quantity}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Available: </span>
                    <span className="font-semibold text-green-400">
                      {ticket.quantity - ticket.sold}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSellTicket(ticket._id)}
                  disabled={ticket.sold >= ticket.quantity}
                  className="inline-flex items-center gap-2 rounded-xl border border-green-300/40 bg-green-400/20 px-4 py-2 text-sm font-semibold text-green-100 transition hover:bg-green-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="h-4 w-4" strokeWidth={1.8} />
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
                  className="inline-flex items-center gap-2 rounded-xl border border-red-300/40 bg-red-400/20 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-400/30"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.8} />
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
