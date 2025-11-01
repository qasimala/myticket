import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import { auth } from "./auth";
import { getCurrentUser } from "./users";
import type { Doc, Id } from "./_generated/dataModel";

const QR_WINDOW_MS = 15_000;
const encoder = new TextEncoder();

type SignedToken = {
  qrValue: string;
  expiresAt: number;
};

const bufferToHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const importHmacKey = (secret: string) =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

const computeSignature = (
  key: CryptoKey,
  booking: Doc<"bookings">,
  slot: number
) => {
  const payloadBase = `${booking._id}:${booking.ticketId}:${slot}`;
  return crypto.subtle
    .sign("HMAC", key, encoder.encode(payloadBase))
    .then(bufferToHex);
};

const signSlot = async (
  key: CryptoKey,
  booking: Doc<"bookings">,
  slot: number
): Promise<SignedToken> => {
  const signature = await computeSignature(key, booking, slot);

  return {
    qrValue: JSON.stringify({
      bookingId: booking._id,
      ticketId: booking.ticketId,
      ts: slot,
      sig: signature,
    }),
    expiresAt: (slot + 1) * QR_WINDOW_MS,
  };
};

// Query to get user's bookings
export const myBookings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Enrich with ticket and event details
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const ticket = await ctx.db.get(booking.ticketId);
        const event = await ctx.db.get(booking.eventId);
        return {
          ...booking,
          ticket,
          event,
        };
      })
    );

    return enrichedBookings;
  },
});

// Query to get user's bookings grouped by event
export const myBookingsByEvent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Enrich with ticket and event details
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const ticket = await ctx.db.get(booking.ticketId);
        const event = await ctx.db.get(booking.eventId);
        return {
          ...booking,
          ticket,
          event,
        };
      })
    );

    // Group by event
    type EnrichedBooking = (typeof enrichedBookings)[0];
    const groupedByEvent = new Map<
      string,
      {
        event: EnrichedBooking["event"];
        bookings: EnrichedBooking[];
      }
    >();

    for (const booking of enrichedBookings) {
      if (!booking.event) continue;
      const eventId = booking.event._id;

      if (!groupedByEvent.has(eventId)) {
        groupedByEvent.set(eventId, {
          event: booking.event,
          bookings: [],
        });
      }

      groupedByEvent.get(eventId)!.bookings.push(booking);
    }

    // Convert to array and sort by most recent booking date
    return Array.from(groupedByEvent.values()).sort((a, b) => {
      const aLatest = Math.max(...a.bookings.map((b) => b.bookingDate));
      const bLatest = Math.max(...b.bookings.map((b) => b.bookingDate));
      return bLatest - aLatest;
    });
  },
});

// Query to get all bookings for a specific event for the current user
export const getBookingsByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();

    // Enrich with ticket and event details
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const ticket = await ctx.db.get(booking.ticketId);
        const event = await ctx.db.get(booking.eventId);
        return {
          ...booking,
          ticket,
          event,
        };
      })
    );

    return enrichedBookings;
  },
});

type ScanResult =
  | { status: "ok"; booking: Record<string, unknown> }
  | { status: "already_used"; booking: Record<string, unknown> }
  | { status: "invalid"; reason: string };

type ValidateResult =
  | { status: "ok"; booking: Record<string, unknown> }
  | { status: "already_validated"; booking: Record<string, unknown> }
  | { status: "already_entered"; booking: Record<string, unknown> }
  | { status: "invalid"; reason: string };

type EntryResult =
  | { status: "ok"; booking: Record<string, unknown> }
  | { status: "already_entered"; booking: Record<string, unknown> }
  | { status: "invalid"; reason: string };

export const scanQrToken = action({
  args: {
    token: v.string(),
    markScanned: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<ScanResult> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    let parsed: {
      bookingId?: string;
      ticketId?: string;
      ts?: number | string;
      sig?: string;
    };

    try {
      parsed = JSON.parse(args.token);
    } catch {
      return { status: "invalid", reason: "Malformed QR code" };
    }

    const bookingIdRaw = parsed.bookingId;
    const ticketId = parsed.ticketId;
    const tsRaw = parsed.ts;
    const signature = parsed.sig;

    const slot =
      typeof tsRaw === "number"
        ? tsRaw
        : typeof tsRaw === "string"
          ? Number(tsRaw)
          : NaN;

    if (
      typeof bookingIdRaw !== "string" ||
      typeof ticketId !== "string" ||
      typeof signature !== "string" ||
      !Number.isInteger(slot)
    ) {
      return { status: "invalid", reason: "Invalid QR payload" };
    }

    const bookingId = bookingIdRaw as Id<"bookings">;

    const result = await ctx.runQuery(internal.bookings.getBookingForQr, {
      bookingId,
    });
    if (!result) {
      return { status: "invalid", reason: "Booking not found" };
    }

    const { booking, event, ticket } = result;

    const currentUser = await ctx.runQuery(api.users.current, {});
    const isEventOwner =
      currentUser && event && event.createdBy === currentUser._id;
    const isPrivileged =
      currentUser &&
      (currentUser.role === "admin" || currentUser.role === "superadmin");

    if (!isEventOwner && !isPrivileged) {
      return {
        status: "invalid",
        reason: "Not authorized to verify this ticket",
      };
    }

    if (booking.ticketId !== ticketId) {
      return { status: "invalid", reason: "Ticket mismatch" };
    }

    const secret = process.env.QR_SECRET;
    if (!secret) {
      throw new Error("QR_SECRET environment variable not configured");
    }

    const key = await importHmacKey(secret);
    const expectedSignature = await computeSignature(key, booking, slot);

    if (expectedSignature !== signature) {
      return { status: "invalid", reason: "Signature mismatch" };
    }

    const nowSlot = Math.floor(Date.now() / QR_WINDOW_MS);
    if (slot < nowSlot - 1) {
      return { status: "invalid", reason: "Ticket expired" };
    }
    if (slot > nowSlot + 1) {
      return { status: "invalid", reason: "Ticket not yet valid" };
    }

    const bookingSummary: Record<string, unknown> = {
      id: booking._id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      quantity: booking.quantity,
      eventName: event?.name ?? null,
      ticketName: ticket?.name ?? null,
      scannedAt: booking.scannedAt ?? null,
    };

    if (booking.scanned) {
      return {
        status: "already_used",
        booking: bookingSummary,
      };
    }

    if (args.markScanned !== false) {
      await ctx.runMutation(api.bookings.setScannedStatus, {
        bookingId: booking._id,
        scanned: true,
      });
      bookingSummary.scannedAt = Date.now();
    }

    return {
      status: "ok",
      booking: bookingSummary,
    };
  },
});

// New action to validate a ticket (Step 1)
export const validateTicket = action({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args): Promise<ValidateResult> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    let parsed: {
      bookingId?: string;
      ticketId?: string;
      ts?: number | string;
      sig?: string;
    };

    try {
      parsed = JSON.parse(args.token);
    } catch {
      return { status: "invalid", reason: "Malformed QR code" };
    }

    const bookingIdRaw = parsed.bookingId;
    const ticketId = parsed.ticketId;
    const tsRaw = parsed.ts;
    const signature = parsed.sig;

    const slot =
      typeof tsRaw === "number"
        ? tsRaw
        : typeof tsRaw === "string"
          ? Number(tsRaw)
          : NaN;

    if (
      typeof bookingIdRaw !== "string" ||
      typeof ticketId !== "string" ||
      typeof signature !== "string" ||
      !Number.isInteger(slot)
    ) {
      return { status: "invalid", reason: "Invalid QR payload" };
    }

    const bookingId = bookingIdRaw as Id<"bookings">;

    const result = await ctx.runQuery(internal.bookings.getBookingForQr, {
      bookingId,
    });
    if (!result) {
      return { status: "invalid", reason: "Booking not found" };
    }

    const { booking, event, ticket } = result;

    const currentUser = await ctx.runQuery(api.users.current, {});
    const isEventOwner =
      currentUser && event && event.createdBy === currentUser._id;
    const isPrivileged =
      currentUser &&
      (currentUser.role === "admin" || currentUser.role === "superadmin");

    if (!isEventOwner && !isPrivileged) {
      return {
        status: "invalid",
        reason: "Not authorized to validate this ticket",
      };
    }

    if (booking.ticketId !== ticketId) {
      return { status: "invalid", reason: "Ticket mismatch" };
    }

    const secret = process.env.QR_SECRET;
    if (!secret) {
      throw new Error("QR_SECRET environment variable not configured");
    }

    const key = await importHmacKey(secret);
    const expectedSignature = await computeSignature(key, booking, slot);

    if (expectedSignature !== signature) {
      return { status: "invalid", reason: "Signature mismatch" };
    }

    const nowSlot = Math.floor(Date.now() / QR_WINDOW_MS);
    if (slot < nowSlot - 1) {
      return { status: "invalid", reason: "Ticket expired" };
    }
    if (slot > nowSlot + 1) {
      return { status: "invalid", reason: "Ticket not yet valid" };
    }

    const bookingSummary: Record<string, unknown> = {
      id: booking._id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      quantity: booking.quantity,
      eventName: event?.name ?? null,
      ticketName: ticket?.name ?? null,
      validatedAt: booking.validatedAt ?? null,
      scannedAt: booking.scannedAt ?? null,
    };

    // Check if already entered (can't validate after entry)
    if (booking.scanned) {
      return {
        status: "already_entered",
        booking: bookingSummary,
      };
    }

    // Check if already validated
    if (booking.validated) {
      return {
        status: "already_validated",
        booking: bookingSummary,
      };
    }

    // Mark as validated
    await ctx.runMutation(api.bookings.setValidatedStatus, {
      bookingId: booking._id,
      validated: true,
    });
    bookingSummary.validatedAt = Date.now();

    return {
      status: "ok",
      booking: bookingSummary,
    };
  },
});

// New action to record entry (Step 2)
export const recordEntry = action({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args): Promise<EntryResult> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    let parsed: {
      bookingId?: string;
      ticketId?: string;
      ts?: number | string;
      sig?: string;
    };

    try {
      parsed = JSON.parse(args.token);
    } catch {
      return { status: "invalid", reason: "Malformed QR code" };
    }

    const bookingIdRaw = parsed.bookingId;
    const ticketId = parsed.ticketId;
    const tsRaw = parsed.ts;
    const signature = parsed.sig;

    const slot =
      typeof tsRaw === "number"
        ? tsRaw
        : typeof tsRaw === "string"
          ? Number(tsRaw)
          : NaN;

    if (
      typeof bookingIdRaw !== "string" ||
      typeof ticketId !== "string" ||
      typeof signature !== "string" ||
      !Number.isInteger(slot)
    ) {
      return { status: "invalid", reason: "Invalid QR payload" };
    }

    const bookingId = bookingIdRaw as Id<"bookings">;

    const result = await ctx.runQuery(internal.bookings.getBookingForQr, {
      bookingId,
    });
    if (!result) {
      return { status: "invalid", reason: "Booking not found" };
    }

    const { booking, event, ticket } = result;

    const currentUser = await ctx.runQuery(api.users.current, {});
    const isEventOwner =
      currentUser && event && event.createdBy === currentUser._id;
    const isPrivileged =
      currentUser &&
      (currentUser.role === "admin" || currentUser.role === "superadmin");

    if (!isEventOwner && !isPrivileged) {
      return {
        status: "invalid",
        reason: "Not authorized to record entry for this ticket",
      };
    }

    if (booking.ticketId !== ticketId) {
      return { status: "invalid", reason: "Ticket mismatch" };
    }

    const secret = process.env.QR_SECRET;
    if (!secret) {
      throw new Error("QR_SECRET environment variable not configured");
    }

    const key = await importHmacKey(secret);
    const expectedSignature = await computeSignature(key, booking, slot);

    if (expectedSignature !== signature) {
      return { status: "invalid", reason: "Signature mismatch" };
    }

    const nowSlot = Math.floor(Date.now() / QR_WINDOW_MS);
    if (slot < nowSlot - 1) {
      return { status: "invalid", reason: "Ticket expired" };
    }
    if (slot > nowSlot + 1) {
      return { status: "invalid", reason: "Ticket not yet valid" };
    }

    const bookingSummary: Record<string, unknown> = {
      id: booking._id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      quantity: booking.quantity,
      eventName: event?.name ?? null,
      ticketName: ticket?.name ?? null,
      validatedAt: booking.validatedAt ?? null,
      scannedAt: booking.scannedAt ?? null,
    };

    // Check if already entered
    if (booking.scanned) {
      return {
        status: "already_entered",
        booking: bookingSummary,
      };
    }

    // Mark as entered (scanned)
    await ctx.runMutation(api.bookings.setScannedStatus, {
      bookingId: booking._id,
      scanned: true,
    });
    bookingSummary.scannedAt = Date.now();

    return {
      status: "ok",
      booking: bookingSummary,
    };
  },
});

// Internal mutation to update payment status (called by webhook)
export const updatePaymentStatus = internalMutation({
  args: {
    paymentId: v.string(),
    status: v.string(),
    resultCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Find booking by payment ID
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_payment_id", (q) => q.eq("paymentId", args.paymentId))
      .collect();

    if (bookings.length === 0) {
      console.error("Booking not found for payment ID:", args.paymentId);
      return;
    }

    const booking = bookings[0];

    // Check if payment was successful
    // PeachPayments success codes start with 000.000 or 000.100
    const isSuccess =
      args.resultCode.startsWith("000.000") ||
      args.resultCode.startsWith("000.100");

    if (isSuccess) {
      // Payment successful - confirm booking
      await ctx.db.patch(booking._id, {
        paymentStatus: "completed",
        status: "confirmed",
      });

      // Don't update ticket sold count here - it was already done during checkout
    } else {
      // Payment failed - release tickets
      await ctx.db.patch(booking._id, {
        paymentStatus: "failed",
        status: "cancelled",
      });

      // Return tickets to availability
      const ticket = await ctx.db.get(booking.ticketId);
      if (ticket) {
        await ctx.db.patch(booking.ticketId, {
          sold: Math.max(0, ticket.sold - booking.quantity),
          status: "available",
        });
      }
    }
  },
});
// Query to get a single booking
export const getBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;

    let event = await ctx.db.get(booking.eventId);

    if (booking.userId !== userId) {
      const currentUser = await getCurrentUser(ctx);
      if (!currentUser) {
        throw new Error("Not authorized");
      }

      if (!event) throw new Error("Event not found");

      const isEventOwner = event.createdBy === currentUser._id;
      const isPrivileged =
        currentUser.role === "admin" || currentUser.role === "superadmin";

      if (!isEventOwner && !isPrivileged) {
        throw new Error("Not authorized");
      }
    }

    const ticket = await ctx.db.get(booking.ticketId);
    if (!event) {
      event = await ctx.db.get(booking.eventId);
    }

    if (!event) {
      throw new Error("Event not found");
    }

    return {
      ...booking,
      ticket,
      event,
    };
  },
});

// Mutation to checkout (create bookings from cart)
export const checkout = mutation({
  args: {
    customerName: v.string(),
    customerId: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be signed in to checkout");

    // Get user's cart
    const cartItems = await ctx.db
      .query("cart")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    const bookingIds: string[] = [];

    // Process each cart item
    for (const cartItem of cartItems) {
      const ticket = await ctx.db.get(cartItem.ticketId);
      if (!ticket) {
        throw new Error(`Ticket ${cartItem.ticketId} not found`);
      }

      // Check availability
      const availableTickets = ticket.quantity - ticket.sold;
      if (cartItem.quantity > availableTickets) {
        throw new Error(
          `Not enough tickets available for ${ticket.name}. Only ${availableTickets} left.`
        );
      }

      // Create booking with pending payment status
      const bookingId = await ctx.db.insert("bookings", {
        userId,
        eventId: ticket.eventId,
        ticketId: cartItem.ticketId,
        quantity: cartItem.quantity,
        totalPrice: ticket.price * cartItem.quantity,
        status: "pending",
        paymentStatus: "pending",
        bookingDate: Date.now(),
        customerName: args.customerName,
        customerId: args.customerId,
        customerPhone: args.customerPhone,
        customerEmail: args.customerEmail,
        scanned: false,
      });

      bookingIds.push(bookingId);

      // Update ticket sold count
      await ctx.db.patch(cartItem.ticketId, {
        sold: ticket.sold + cartItem.quantity,
      });

      // Auto-update status if sold out
      if (ticket.sold + cartItem.quantity >= ticket.quantity) {
        await ctx.db.patch(cartItem.ticketId, {
          status: "sold_out",
        });
      }

      // Remove from cart
      await ctx.db.delete(cartItem._id);
    }

    return bookingIds;
  },
});

// Mutation to cancel a booking
export const cancelBooking = mutation({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");

    if (booking.userId !== userId) {
      throw new Error("Not authorized");
    }

    if (booking.status === "cancelled") {
      throw new Error("Booking is already cancelled");
    }

    // Update booking status
    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
    });

    // Return tickets to availability
    const ticket = await ctx.db.get(booking.ticketId);
    if (ticket) {
      await ctx.db.patch(booking.ticketId, {
        sold: Math.max(0, ticket.sold - booking.quantity),
        status: "available", // Make available again
      });
    }
  },
});

export const setScannedStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    scanned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Must be signed in");

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");

    const event = await ctx.db.get(booking.eventId);
    if (!event) throw new Error("Event not found");

    const isEventOwner = event.createdBy === user._id;
    const isPrivileged = user.role === "admin" || user.role === "superadmin";

    if (!isEventOwner && !isPrivileged) {
      throw new Error("Not authorized to update scan status");
    }

    await ctx.db.patch(args.bookingId, {
      scanned: args.scanned,
      scannedAt: args.scanned ? Date.now() : undefined,
    });
  },
});

export const setValidatedStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    validated: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Must be signed in");

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");

    const event = await ctx.db.get(booking.eventId);
    if (!event) throw new Error("Event not found");

    const isEventOwner = event.createdBy === user._id;
    const isPrivileged = user.role === "admin" || user.role === "superadmin";

    if (!isEventOwner && !isPrivileged) {
      throw new Error("Not authorized to update validated status");
    }

    await ctx.db.patch(args.bookingId, {
      validated: args.validated,
      validatedAt: args.validated ? Date.now() : undefined,
    });
  },
});

export const getUserBookingsCount = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return bookings.length;
  },
});

export const getBookingForQr = internalQuery({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      return null;
    }

    const event = await ctx.db.get(booking.eventId);
    const ticket = await ctx.db.get(booking.ticketId);

    return {
      booking,
      event,
      ticket,
    };
  },
});

export const generateQrToken = action({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ windowMs: number; tokens: SignedToken[] }> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const result = await ctx.runQuery(internal.bookings.getBookingForQr, {
      bookingId: args.bookingId,
    });
    if (!result) throw new Error("Booking not found");

    const { booking, event } = result;

    if (booking.scanned) {
      throw new Error("Ticket already used");
    }

    if (!event) throw new Error("Event not found");

    const currentUser = await ctx.runQuery(api.users.current, {});
    const isBookingOwner = booking.userId === userId;
    const isEventOwner = currentUser && event.createdBy === currentUser._id;
    const isPrivileged =
      currentUser &&
      (currentUser.role === "admin" || currentUser.role === "superadmin");

    if (!isBookingOwner && !isEventOwner && !isPrivileged) {
      throw new Error("Not authorized to generate QR token");
    }

    const secret = process.env.QR_SECRET;
    if (!secret) {
      throw new Error("QR_SECRET environment variable not configured");
    }

    const key = await importHmacKey(secret);
    const timeSlot = Math.floor(Date.now() / QR_WINDOW_MS);

    const tokens = await Promise.all([
      signSlot(key, booking, timeSlot),
      signSlot(key, booking, timeSlot + 1),
    ]);

    return {
      windowMs: QR_WINDOW_MS,
      tokens,
    };
  },
});

/**
 * Get QR secret for client-side generation (only for authorized users)
 * This allows offline QR generation on web/mobile
 */
export const getQrSecret = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    // Only allow users who have bookings or are admins to get the secret
    // This prevents unauthorized access to the secret
    const currentUser = await ctx.runQuery(api.users.current, {});
    if (!currentUser) throw new Error("User not found");

    const isPrivileged =
      currentUser.role === "admin" || currentUser.role === "superadmin";

    // Check if user has any bookings (authorized to generate QR codes)
    const userBookings = await ctx.runQuery(internal.bookings.getUserBookingsCount, {
      userId,
    });

    if (!isPrivileged && userBookings === 0) {
      throw new Error("Not authorized to access QR secret");
    }

    const secret = process.env.QR_SECRET;
    if (!secret) {
      throw new Error("QR_SECRET environment variable not configured");
    }

    return secret;
  },
});