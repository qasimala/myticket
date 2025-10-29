import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Query to get current user's cart with full ticket and event details
export const getCart = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const cartItems = await ctx.db
      .query("cart")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Enrich cart items with ticket and event details
    const enrichedItems = await Promise.all(
      cartItems.map(async (item) => {
        const ticket = await ctx.db.get(item.ticketId);
        if (!ticket) return null;

        const event = await ctx.db.get(ticket.eventId);
        if (!event) return null;

        return {
          ...item,
          ticket,
          event,
        };
      })
    );

    return enrichedItems.filter((item) => item !== null);
  },
});

// Query to get cart item count
export const getCartCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return 0;

    const cartItems = await ctx.db
      .query("cart")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  },
});

// Mutation to add item to cart
export const addToCart = mutation({
  args: {
    ticketId: v.id("tickets"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be signed in to add to cart");

    if (args.quantity < 1) {
      throw new Error("Quantity must be at least 1");
    }

    // Check if ticket exists and is available
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    if (ticket.status !== "available") {
      throw new Error("This ticket is not available for purchase");
    }

    const availableTickets = ticket.quantity - ticket.sold;
    if (args.quantity > availableTickets) {
      throw new Error(`Only ${availableTickets} tickets available`);
    }

    // Check if item already in cart
    const existingCartItems = await ctx.db
      .query("cart")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const existingItem = existingCartItems.find(
      (item) => item.ticketId === args.ticketId
    );

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + args.quantity;
      if (newQuantity > availableTickets) {
        throw new Error(`Only ${availableTickets} tickets available`);
      }
      await ctx.db.patch(existingItem._id, {
        quantity: newQuantity,
      });
      return existingItem._id;
    } else {
      // Add new item
      return await ctx.db.insert("cart", {
        userId,
        ticketId: args.ticketId,
        quantity: args.quantity,
        addedAt: Date.now(),
      });
    }
  },
});

// Mutation to update cart item quantity
export const updateCartItem = mutation({
  args: {
    cartItemId: v.id("cart"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const cartItem = await ctx.db.get(args.cartItemId);
    if (!cartItem) throw new Error("Cart item not found");

    if (cartItem.userId !== userId) {
      throw new Error("Not authorized");
    }

    if (args.quantity < 1) {
      throw new Error("Quantity must be at least 1");
    }

    // Check ticket availability
    const ticket = await ctx.db.get(cartItem.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const availableTickets = ticket.quantity - ticket.sold;
    if (args.quantity > availableTickets) {
      throw new Error(`Only ${availableTickets} tickets available`);
    }

    await ctx.db.patch(args.cartItemId, {
      quantity: args.quantity,
    });
  },
});

// Mutation to remove item from cart
export const removeFromCart = mutation({
  args: {
    cartItemId: v.id("cart"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const cartItem = await ctx.db.get(args.cartItemId);
    if (!cartItem) throw new Error("Cart item not found");

    if (cartItem.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.cartItemId);
  },
});

// Mutation to clear entire cart
export const clearCart = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const cartItems = await ctx.db
      .query("cart")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const item of cartItems) {
      await ctx.db.delete(item._id);
    }
  },
});

