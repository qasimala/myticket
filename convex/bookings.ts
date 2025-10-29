import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

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

// Query to get a single booking
export const getBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;

    if (booking.userId !== userId) {
      throw new Error("Not authorized");
    }

    const ticket = await ctx.db.get(booking.ticketId);
    const event = await ctx.db.get(booking.eventId);

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
        customerName: "Customer", // Default name since we don't collect it
        customerEmail: args.customerEmail,
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

