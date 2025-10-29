import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { auth } from "./auth";

// Helper function to get current user profile with role
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const userId = await auth.getUserId(ctx);
  if (!userId) {
    return null;
  }
  
  // Get user profile
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  
  return profile || null;
}

// Helper function to check if user has required role
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: ("user" | "admin" | "superadmin")[]
) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Insufficient permissions. Required: ${allowedRoles.join(" or ")}`);
  }
  return user;
}

// Helper to check if user is at least admin
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  return await requireRole(ctx, ["admin", "superadmin"]);
}

// Helper to check if user is superadmin
export async function requireSuperAdmin(ctx: QueryCtx | MutationCtx) {
  return await requireRole(ctx, ["superadmin"]);
}

// Query to get current user info
export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Query to list all users (admin only)
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    
    // Get all profiles with their auth user data
    const profiles = await ctx.db.query("userProfiles").collect();
    
    // Enrich with email from auth users table
    const enrichedProfiles = await Promise.all(
      profiles.map(async (profile) => {
        const authUser = await ctx.db.get(profile.userId);
        return {
          ...profile,
          email: authUser?.email || "unknown",
        };
      })
    );
    
    return enrichedProfiles;
  },
});

// Mutation to create user profile after sign up (called automatically by getCurrentUser now)
export const createUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existing) {
      return existing._id;
    }

    // Create new user profile with default role
    const profileId = await ctx.db.insert("userProfiles", {
      userId: userId,
      name: args.name,
      role: "user", // Default role
      createdAt: Date.now(),
    });

    return profileId;
  },
});

// Mutation to update user role (admin only)
export const updateRole = mutation({
  args: {
    profileId: v.id("userProfiles"),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("superadmin")),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireSuperAdmin(ctx);
    
    // Prevent self-demotion
    if (currentUser._id === args.profileId && args.role !== "superadmin") {
      throw new Error("Cannot change your own superadmin role");
    }

    await ctx.db.patch(args.profileId, { role: args.role });
  },
});

// Mutation to update user profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await getCurrentUser(ctx);
    if (!profile) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(profile._id, {
      name: args.name,
    });
  },
});

// Mutation to delete user (superadmin only)
export const remove = mutation({
  args: { profileId: v.id("userProfiles") },
  handler: async (ctx, args) => {
    const currentUser = await requireSuperAdmin(ctx);
    
    // Prevent self-deletion
    if (currentUser._id === args.profileId) {
      throw new Error("Cannot delete your own account");
    }

    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Profile not found");

    // Delete all events created by this user (filter to handle optional createdBy)
    const allEvents = await ctx.db.query("events").collect();
    const userEvents = allEvents.filter(event => event.createdBy === args.profileId);

    for (const event of userEvents) {
      // Delete tickets for each event
      const tickets = await ctx.db
        .query("tickets")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect();
      
      for (const ticket of tickets) {
        await ctx.db.delete(ticket._id);
      }
      
      await ctx.db.delete(event._id);
    }

    // Delete the profile
    await ctx.db.delete(args.profileId);
    
    // Optionally delete the auth user too
    await ctx.db.delete(profile.userId);
  },
});

