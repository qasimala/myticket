import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Query to get all tickets
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tickets").collect();
  },
});

// Query to get all tickets for an event
export const listByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

// Query to get a single ticket
export const get = query({
  args: { id: v.id("tickets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Mutation to create a new ticket type
export const create = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Check if user owns the event
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Check permissions: must be creator or admin
    if (
      event.createdBy !== user._id &&
      user.role !== "admin" &&
      user.role !== "superadmin"
    ) {
      throw new Error("You don't have permission to add tickets to this event");
    }

    const ticketId = await ctx.db.insert("tickets", {
      eventId: args.eventId,
      name: args.name,
      description: args.description,
      price: args.price,
      quantity: args.quantity,
      sold: 0,
      status: "available",
    });
    return ticketId;
  },
});

// Mutation to update a ticket type
export const update = mutation({
  args: {
    id: v.id("tickets"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    quantity: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("available"),
        v.literal("sold_out"),
        v.literal("hidden")
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const ticket = await ctx.db.get(args.id);
    if (!ticket) throw new Error("Ticket not found");

    const event = await ctx.db.get(ticket.eventId);
    if (!event) throw new Error("Event not found");

    // Check permissions: must be creator or admin
    if (
      event.createdBy !== user._id &&
      user.role !== "admin" &&
      user.role !== "superadmin"
    ) {
      throw new Error("You don't have permission to update this ticket");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Mutation to delete a ticket type
export const remove = mutation({
  args: { id: v.id("tickets") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const ticket = await ctx.db.get(args.id);
    if (!ticket) throw new Error("Ticket not found");

    const event = await ctx.db.get(ticket.eventId);
    if (!event) throw new Error("Event not found");

    // Check permissions: must be creator or admin
    if (
      event.createdBy !== user._id &&
      user.role !== "admin" &&
      user.role !== "superadmin"
    ) {
      throw new Error("You don't have permission to delete this ticket");
    }

    await ctx.db.delete(args.id);
  },
});

// Mutation to "sell" a ticket (increment sold count)
export const sell = mutation({
  args: { id: v.id("tickets"), quantity: v.number() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.id);
    if (!ticket) throw new Error("Ticket not found");

    const newSold = ticket.sold + args.quantity;

    if (newSold > ticket.quantity) {
      throw new Error("Not enough tickets available");
    }

    const updates: any = { sold: newSold };

    // Auto-update status if sold out
    if (newSold >= ticket.quantity) {
      updates.status = "sold_out";
    }

    await ctx.db.patch(args.id, updates);
  },
});
