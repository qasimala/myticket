import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  userProfiles: defineTable({
    userId: v.id("users"), // References the auth users table
    name: v.optional(v.string()),
    id: v.optional(v.string()), // ID number (e.g., national ID, passport)
    phone: v.optional(v.string()), // Phone number
    role: v.union(
      v.literal("user"),
      v.literal("admin"),
      v.literal("superadmin")
    ),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  events: defineTable({
    name: v.string(),
    description: v.string(),
    date: v.string(), // ISO date string
    country: v.string(),
    city: v.string(),
    location: v.string(), // Venue name
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    about: v.string(), // Detailed information about the event
    accessibility: v.string(), // Accessibility information
    faqs: v.string(), // FAQs in JSON string format (array of {question, answer})
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("cancelled")
    ),
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
    status: v.union(
      v.literal("available"),
      v.literal("sold_out"),
      v.literal("hidden")
    ),
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
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    paymentId: v.optional(v.string()), // PeachPayments checkout ID
    paymentCheckoutUrl: v.optional(v.string()), // URL to redirect user for payment
    bookingDate: v.number(),
    customerName: v.string(),
    customerId: v.optional(v.string()), // Customer ID number
    customerPhone: v.optional(v.string()), // Customer phone number
    customerEmail: v.string(),
    validated: v.optional(v.boolean()), // Step 1: Ticket validated
    validatedAt: v.optional(v.number()), // When ticket was validated
    scanned: v.optional(v.boolean()), // Step 2: Entry recorded (final step)
    scannedAt: v.optional(v.number()), // When entry was recorded
  })
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_status", ["status"])
    .index("by_payment_id", ["paymentId"]),
});
