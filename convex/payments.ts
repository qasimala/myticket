import { v } from "convex/values";
import {
  action,
  query,
  internalMutation,
  internalQuery,
  type ActionCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { auth } from "./auth";

type InitializePaymentArgs = {
  bookingId: Id<"bookings">;
};

type InitializePaymentResult = {
  checkoutId: string;
  paymentUrl?: string;
  widgetUrl: string;
  isMock?: boolean;
};

// Initialize payment with PeachPayments
export const initializePayment = action({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (
    ctx: ActionCtx,
    args: InitializePaymentArgs
  ): Promise<InitializePaymentResult> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const booking = (await ctx.runQuery(
      internal.payments.getBookingForPayment,
      {
        bookingId: args.bookingId,
        userId,
      }
    )) as Doc<"bookings"> | null;
    if (!booking) throw new Error("Booking not found");

    if (booking.paymentStatus !== "pending") {
      throw new Error("Payment already processed");
    }

    const siteUrl = process.env.SITE_URL || "http://localhost:3000";
    const mockPaymentId = `mock_${booking._id}_${Date.now()}`;

    await ctx.runMutation(internal.payments.markPaymentCompleted, {
      bookingId: args.bookingId,
      paymentId: mockPaymentId,
    });

    return {
      checkoutId: mockPaymentId,
      paymentUrl: `${siteUrl}/payment/result?bookingId=${booking._id}`,
      widgetUrl: "",
      isMock: true,
    };
  },
});

// Query payment status from PeachPayments
export const checkPaymentStatus = query({
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

    return {
      paymentStatus: booking.paymentStatus,
      paymentId: booking.paymentId,
      status: booking.status,
    };
  },
});

export const getBookingForPayment = internalQuery({
  args: {
    bookingId: v.id("bookings"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      return null;
    }

    if (booking.userId !== args.userId) {
      throw new Error("Not authorized");
    }

    return booking;
  },
});

export const markPaymentCompleted = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    paymentId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId, {
      paymentId: args.paymentId,
      paymentStatus: "completed",
      status: "confirmed",
      paymentCheckoutUrl: undefined,
    });
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

