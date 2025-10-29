import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireRole } from "./users";

// Query to get all events (public)
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .order("desc")
      .collect();
  },
});

// Query to get events created by current user
export const myEvents = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Get all events and filter by creator (handles both legacy and new events)
    const allEvents = await ctx.db.query("events").collect();
    return allEvents.filter(event => event.createdBy === user._id);
  },
});

// Query to get published events only
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .collect();
    return events.filter(event => event.status === "published");
  },
});

// Query to get a single event by ID
export const get = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Mutation to create a new event (authenticated users only)
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    date: v.string(),
    location: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireRole(ctx, ["user", "admin", "superadmin"]);

    const eventId = await ctx.db.insert("events", {
      name: args.name,
      description: args.description,
      date: args.date,
      location: args.location,
      imageUrl: args.imageUrl,
      status: "draft",
      createdAt: Date.now(),
      createdBy: user._id,
    });
    return eventId;
  },
});

// Mutation to update an event
export const update = mutation({
  args: {
    id: v.id("events"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.string()),
    location: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");

    // Check permissions: must be creator or admin (legacy events without creator can be edited by anyone)
    if (event.createdBy && event.createdBy !== user._id && user.role !== "admin" && user.role !== "superadmin") {
      throw new Error("You don't have permission to update this event");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Mutation to delete an event
export const remove = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");

    // Check permissions: must be creator or admin (legacy events without creator can be deleted by anyone)
    if (event.createdBy && event.createdBy !== user._id && user.role !== "admin" && user.role !== "superadmin") {
      throw new Error("You don't have permission to delete this event");
    }

    // Also delete all tickets for this event
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.id))
      .collect();
    
    for (const ticket of tickets) {
      await ctx.db.delete(ticket._id);
    }
    
    await ctx.db.delete(args.id);
  },
});

// Mutation to publish an event
export const publish = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");

    // Check permissions: must be creator or admin (legacy events without creator can be published by anyone)
    if (event.createdBy && event.createdBy !== user._id && user.role !== "admin" && user.role !== "superadmin") {
      throw new Error("You don't have permission to publish this event");
    }

    await ctx.db.patch(args.id, { status: "published" });
  },
});

