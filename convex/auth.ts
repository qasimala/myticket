import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      // Get the auth user
      const user = await ctx.db.get(args.userId);
      if (!user) return;
      
      // Check if user profile exists
      const profiles = await ctx.db.query("userProfiles").collect();
      const existingProfile = profiles.find(p => p.userId === args.userId);
      
      if (!existingProfile) {
        // Create user profile with default role
        await ctx.db.insert("userProfiles", {
          userId: args.userId,
          name: user.name,
          role: "user",
          createdAt: Date.now(),
        });
      }
    },
  },
});

