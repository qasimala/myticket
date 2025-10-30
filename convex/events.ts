import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { getCurrentUser, requireRole } from "./users";

type EventRecord = {
  imageStorageId?: string;
  imageUrl?: string;
};

const withEventImageUrl = async <T extends EventRecord>(
  ctx: QueryCtx,
  event: T
): Promise<T> => {
  if (event?.imageStorageId) {
    const url = await ctx.storage.getUrl(event.imageStorageId);
    return {
      ...event,
      imageUrl: url ?? event.imageUrl ?? undefined,
    };
  }
  return event;
};

const mapEventsWithImages = async <T extends EventRecord>(
  ctx: QueryCtx,
  events: T[]
) => Promise.all(events.map((event) => withEventImageUrl(ctx, event)));

// Query to get all events (public)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .order("desc")
      .collect();
    return await mapEventsWithImages(ctx, events);
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
    const filtered = allEvents.filter(event => event.createdBy === user._id);
    return await mapEventsWithImages(ctx, filtered);
  },
});

// Query to get published events only
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .collect();
    const published = events.filter(event => event.status === "published");
    return await mapEventsWithImages(ctx, published);
  },
});

// Query to get a single event by ID
export const get = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    if (!event) return null;
    return await withEventImageUrl(ctx, event);
  },
});

// Mutation to create a new event (admin only)
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    date: v.string(),
    country: v.string(),
    city: v.string(),
    location: v.string(),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    about: v.string(),
    accessibility: v.string(),
    faqs: v.string(),
  },
  handler: async (ctx, args) => {
    // Require admin or superadmin role
    const user = await requireRole(ctx, ["admin", "superadmin"]);

    const storageUrl = args.imageStorageId
      ? await ctx.storage.getUrl(args.imageStorageId)
      : undefined;

    const eventId = await ctx.db.insert("events", {
      name: args.name,
      description: args.description,
      date: args.date,
      country: args.country,
      city: args.city,
      location: args.location,
      imageUrl: storageUrl ?? args.imageUrl,
      imageStorageId: args.imageStorageId,
      about: args.about,
      accessibility: args.accessibility,
      faqs: args.faqs,
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
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    location: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    about: v.optional(v.string()),
    accessibility: v.optional(v.string()),
    faqs: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");

    // Check permissions: must be creator or admin
    if (event.createdBy !== user._id && user.role !== "admin" && user.role !== "superadmin") {
      throw new Error("You don't have permission to update this event");
    }

    const { id, imageStorageId, ...rest } = args;
    const updates: Record<string, any> = { ...rest };

    if (imageStorageId !== undefined) {
      updates.imageStorageId = imageStorageId;
      updates.imageUrl = imageStorageId
        ? await ctx.storage.getUrl(imageStorageId)
        : updates.imageUrl;
    }

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

    // Check permissions: must be creator or admin
    if (event.createdBy !== user._id && user.role !== "admin" && user.role !== "superadmin") {
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

    // Check permissions: must be creator or admin
    if (event.createdBy !== user._id && user.role !== "admin" && user.role !== "superadmin") {
      throw new Error("You don't have permission to publish this event");
    }

    await ctx.db.patch(args.id, { status: "published" });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "superadmin"]);
    return await ctx.storage.generateUploadUrl();
  },
});
