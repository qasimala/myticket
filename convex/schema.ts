import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  
  userProfiles: defineTable({
    userId: v.id("users"), // References the auth users table
    name: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("superadmin")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),

  events: defineTable({
    name: v.string(),
    description: v.string(),
    date: v.string(), // ISO date string
    country: v.string(),
    city: v.string(),
    location: v.string(), // Venue name
    imageUrl: v.optional(v.string()),
    about: v.string(), // Detailed information about the event
    accessibility: v.string(), // Accessibility information
    faqs: v.string(), // FAQs in JSON string format (array of {question, answer})
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled")),
    createdAt: v.number(),
    createdBy: v.id("userProfiles"),
  })
    .index("by_date", ["date"])
    .index("by_creator", ["createdBy"]),

  tickets: defineTable({
    eventId: v.id("events"),
    name: v.string(), // e.g., "General Admission", "VIP", "Early Bird"
    description: v.string(),
    price: v.number(), // in cents
    quantity: v.number(), // total available
    sold: v.number(), // number sold
    status: v.union(v.literal("available"), v.literal("sold_out"), v.literal("hidden")),
  }).index("by_event", ["eventId"]),

  cart: defineTable({
    userId: v.id("users"),
    ticketId: v.id("tickets"),
    quantity: v.number(),
    addedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_ticket", ["ticketId"]),

  bookings: defineTable({
    userId: v.id("users"),
    eventId: v.id("events"),
    ticketId: v.id("tickets"),
    quantity: v.number(),
    totalPrice: v.number(), // in cents
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled")
    ),
    bookingDate: v.number(),
    customerName: v.string(),
    customerEmail: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_status", ["status"]),
});

