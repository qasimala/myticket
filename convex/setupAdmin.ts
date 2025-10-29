import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Create profiles for all users who don't have one
export const createMissingProfiles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const profiles = await ctx.db.query("userProfiles").collect();
    
    let created = 0;
    
    for (const user of users) {
      const hasProfile = profiles.some(p => p.userId === user._id);
      
      if (!hasProfile) {
        await ctx.db.insert("userProfiles", {
          userId: user._id,
          name: user.name,
          role: "user",
          createdAt: Date.now(),
        });
        created++;
      }
    }
    
    return { 
      message: `Created ${created} profile(s)`,
      totalUsers: users.length,
      totalProfiles: profiles.length + created
    };
  },
});

// Make a specific user a superadmin by email
export const makeSuperAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // Find user by email
    const users = await ctx.db.query("users").collect();
    const user = users.find(u => u.email === args.email);
    
    if (!user) {
      throw new Error(`User with email ${args.email} not found`);
    }
    
    // Find or create profile
    const profiles = await ctx.db.query("userProfiles").collect();
    let profile = profiles.find(p => p.userId === user._id);
    
    if (!profile) {
      const profileId = await ctx.db.insert("userProfiles", {
        userId: user._id,
        name: user.name,
        role: "superadmin",
        createdAt: Date.now(),
      });
      return { message: `Created superadmin profile for ${args.email}`, profileId };
    } else {
      await ctx.db.patch(profile._id, { role: "superadmin" });
      return { message: `Promoted ${args.email} to superadmin`, profileId: profile._id };
    }
  },
});

