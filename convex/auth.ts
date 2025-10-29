import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      // Check if user profile exists
      const existingProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .first();
      
      if (!existingProfile) {
        // Create user profile with default role
        await ctx.db.insert("userProfiles", {
          userId: args.userId,
          name: args.existingUser?.name,
          role: "user",
          createdAt: Date.now(),
        });
      }
    },
  },
});

