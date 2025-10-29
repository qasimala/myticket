import { internalMutation } from "./_generated/server";

// This runs after a user signs up to create their profile
export const createProfile = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    for (const user of users) {
      // Check if profile exists
      const existingProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
      
      if (!existingProfile) {
        // Create profile
        await ctx.db.insert("userProfiles", {
          userId: user._id,
          name: user.name,
          role: "user",
          createdAt: Date.now(),
        });
      }
    }
  },
});

