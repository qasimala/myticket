import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { auth } from "./auth";

// Initialize payment with PeachPayments
export const initializePayment = mutation({
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

    if (booking.paymentStatus !== "pending") {
      throw new Error("Payment already processed");
    }

    // Get PeachPayments credentials from environment
    const entityId = process.env.PEACHPAYMENTS_ENTITY_ID;
    const accessToken = process.env.PEACHPAYMENTS_ACCESS_TOKEN;
    const testMode = process.env.PEACHPAYMENTS_TEST_MODE === "true";
    const siteUrl = process.env.SITE_URL || "http://localhost:3000";

    if (!entityId || !accessToken) {
      throw new Error("PeachPayments not configured");
    }

    // Get event details for payment description
    const event = await ctx.db.get(booking.eventId);
    const ticket = await ctx.db.get(booking.ticketId);

    // Prepare payment request
    const amount = (booking.totalPrice / 100).toFixed(2); // Convert cents to dollars
    const paymentData = {
      entityId: entityId,
      amount: amount,
      currency: "ZAR", // South African Rand - change based on your needs
      paymentType: "DB", // Debit (immediate charge)
      customer: {
        email: booking.customerEmail,
        givenName: booking.customerName.split(" ")[0],
        surname: booking.customerName.split(" ").slice(1).join(" ") || "Customer",
      },
      billing: {
        country: "ZA", // Change based on your needs
      },
      merchantTransactionId: booking._id,
      customParameters: {
        bookingId: booking._id,
        eventId: booking.eventId,
      },
      // Redirect URLs
      shopperResultUrl: `${siteUrl}/payment/result?bookingId=${booking._id}`,
      // Notification URL for webhooks
      notificationUrl: `${siteUrl.replace("localhost:3000", "your-domain.convex.site")}/payment-webhook`,
    };

    try {
      // Call PeachPayments API to create checkout
      const baseUrl = testMode
        ? "https://test.oppwa.com/v1/checkouts"
        : "https://oppwa.com/v1/checkouts";

      const formBody = Object.entries(paymentData)
        .flatMap(([key, value]) => {
          if (typeof value === "object" && value !== null) {
            return Object.entries(value).map(
              ([subKey, subValue]) =>
                `${encodeURIComponent(key + "." + subKey)}=${encodeURIComponent(
                  String(subValue)
                )}`
            );
          }
          return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
        })
        .join("&");

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${accessToken}`,
        },
        body: formBody,
      });

      const result = await response.json();

      if (
        !response.ok ||
        !result.id ||
        result.result?.code?.startsWith("000.000")
      ) {
        // Success codes start with 000.000 or 000.100
        console.error("PeachPayments error:", result);
        throw new Error(
          result.result?.description || "Failed to initialize payment"
        );
      }

      // Update booking with payment details
      await ctx.db.patch(args.bookingId, {
        paymentId: result.id,
        paymentStatus: "processing",
        paymentCheckoutUrl: testMode
          ? `https://test.oppwa.com/v1/paymentWidgets.js?checkoutId=${result.id}`
          : `https://oppwa.com/v1/paymentWidgets.js?checkoutId=${result.id}`,
      });

      return {
        checkoutId: result.id,
        paymentUrl: result.redirect?.url,
        widgetUrl: testMode
          ? `https://test.oppwa.com/v1/paymentWidgets.js?checkoutId=${result.id}`
          : `https://oppwa.com/v1/paymentWidgets.js?checkoutId=${result.id}`,
      };
    } catch (error: any) {
      console.error("Payment initialization error:", error);
      
      // Update booking with failed status
      await ctx.db.patch(args.bookingId, {
        paymentStatus: "failed",
      });

      throw new Error(
        error.message || "Failed to initialize payment with PeachPayments"
      );
    }
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

