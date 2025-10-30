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
  
  if (!profile) return null;

  // Get email from auth users table
  const authUser = await ctx.db.get(userId);
  
  return {
    ...profile,
    email: authUser?.email || null,
  };
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

// Query to list all users (admin or superadmin only)
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "superadmin"]);

    const profiles = await ctx.db.query("userProfiles").collect();

    const enriched = await Promise.all(
      profiles.map(async (profile) => {
        const authUser = await ctx.db.get(profile.userId);
        return {
          _id: profile._id,
          userId: profile.userId,
          name: profile.name ?? null,
          role: profile.role,
          createdAt: profile.createdAt,
          email: authUser?.email ?? null,
        };
      })
    );

    return enriched;
  },
});

// Mutation to update user role (superadmin only)
export const updateRole = mutation({
  args: {
    userId: v.id("userProfiles"),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("superadmin")),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireSuperAdmin(ctx);
    
    // Prevent self-demotion
    if (currentUser._id === args.userId && currentUser.role === "superadmin" && args.role !== "superadmin") {
      throw new Error("Cannot demote yourself from superadmin");
    }
    
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

// Mutation to update user name
export const updateName = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!profile) throw new Error("User profile not found");
    
    await ctx.db.patch(profile._id, { name: args.name });
  },
});

// Mutation to delete a user (superadmin only)
export const deleteUser = mutation({
  args: {
    userId: v.id("userProfiles"),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireSuperAdmin(ctx);
    
    // Prevent self-deletion
    if (currentUser._id === args.userId) {
      throw new Error("Cannot delete yourself");
    }
    
    // Get the profile to find the auth userId
    const profile = await ctx.db.get(args.userId);
    if (!profile) throw new Error("User not found");
    
    // Delete all bookings for this user (using auth userId)
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .collect();
    
    for (const booking of bookings) {
      await ctx.db.delete(booking._id);
    }
    
    // Delete cart items (using auth userId)
    const cartItems = await ctx.db
      .query("cart")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .collect();
    
    for (const item of cartItems) {
      await ctx.db.delete(item._id);
    }
    
    // Delete user profile
    await ctx.db.delete(args.userId);
    
    // Note: The auth user will remain in the auth system
    // You may want to handle auth user deletion separately if needed
  },
});

// Setup mutation to make yourself superadmin (seatbelt removed - use wisely!)
export const makeSuperAdmin = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all users to find by email
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Get current user profile
    const currentProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    // Only allow if current user is already superadmin
    if (currentProfile?.role !== "superadmin") {
      throw new Error("Only superadmins can promote users");
    }
    
    // Find user by email
    const allAuthUsers = await ctx.db.query("users").collect();
    const targetAuthUser = allAuthUsers.find(u => u.email === args.email);
    
    if (!targetAuthUser) {
      throw new Error("User with that email not found");
    }
    
    // Find their profile
    const targetProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", targetAuthUser._id))
      .first();
    
    if (!targetProfile) {
      throw new Error("User profile not found");
    }
    
    // Promote to superadmin
    await ctx.db.patch(targetProfile._id, { role: "superadmin" });
    
    return { success: true };
  },
});
