# Environment Setup Guide

## 🔐 Understanding Convex Authentication

### How is Convex Different?

Unlike traditional databases (Supabase, Firebase, etc.), Convex doesn't use secret keys or anon keys:

| Feature | Traditional DB | Convex |
|---------|---------------|--------|
| Connection Auth | Service Key (secret) + Anon Key (public) | Just Public URL |
| Client Access | Direct database queries | Through defined functions only |
| Authorization | At connection/query level | In your Convex functions |
| Security Model | Row-Level Security (RLS) | Function-level auth checks |

### Why is `NEXT_PUBLIC_CONVEX_URL` Public?

- ✅ **It's MEANT to be public** - it's exposed in your client-side code
- ✅ **No direct database access** - clients can only call functions you define
- ✅ **Authorization happens in functions** - you control what each function can do
- ✅ **Built-in rate limiting** - Convex protects against abuse automatically

### CLI Authentication

When you run `npx convex dev`:
1. First time: Opens browser to authenticate with Convex
2. Stores credentials in `~/.convex/` directory
3. Future commands use stored credentials
4. Each team member authenticates separately

---

## 🧪 Testing Against Production Locally

### Step 1: Create Environment Files

Create these files in your project root:

#### `.env.development.local`
```bash
# Development Environment (used by default with npm run dev)
CONVEX_DEPLOYMENT=dev:your-dev-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://happy-animal-123.convex.cloud
```

#### `.env.production.local`
```bash
# Production Environment (for local testing against prod)
CONVEX_DEPLOYMENT=prod:myticket-main
NEXT_PUBLIC_CONVEX_URL=https://your-actual-prod-url.convex.cloud
```

**Where to get these URLs?**
- Run `npx convex dashboard` to open your Convex dashboard
- URLs are shown in the project settings
- Or check your existing `.env.local` file

### Step 2: Use the Right Commands

#### Test Against Development
```bash
npm run dev
```
Uses `.env.development.local` automatically

#### Test Against Production Locally
```bash
npm run dev:prod
```
Uses `.env.production.local` (I've added this command for you!)

#### Build for Production
```bash
npm run build && npm start
```
Uses `.env.production.local`

---

## 📋 Complete Workflow Examples

### Scenario 1: Daily Development
```bash
# Terminal 1: Start dev Convex
npx convex dev --project myticket-dev

# Terminal 2: Start Next.js dev server
npm run dev
```

### Scenario 2: Test Against Production Data
```bash
# Make sure your .env.production.local has prod URL

# Start Next.js in prod mode (reads from prod)
npm run dev:prod
```

### Scenario 3: Deploy to Production
```bash
# Deploy backend
npm run convex:deploy

# Deploy frontend (to Vercel, etc.)
# Vercel will use the NEXT_PUBLIC_CONVEX_URL you set in dashboard
```

---

## 🛡️ Adding Authentication to Your App

Right now, your app has NO authentication - anyone can create/delete tasks.

Here's how to add it:

### Option 1: Use Convex Auth (Easiest)

```bash
npm install @convex-dev/auth
```

Then add auth checks to your functions:

```typescript
// convex/tasks.ts
export const create = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    await ctx.db.insert("tasks", { 
      text: args.text,
      userId: identity.subject,
      isCompleted: false 
    });
  },
});
```

### Option 2: Use Clerk, Auth0, or Custom Auth

Convex integrates with all major auth providers. Check: https://docs.convex.dev/auth

---

## 🔍 Security Best Practices

1. **Always verify authentication in mutations/queries**
   ```typescript
   const user = await ctx.auth.getUserIdentity();
   if (!user) throw new Error("Unauthorized");
   ```

2. **Use function-level permissions**
   ```typescript
   // Only let users access their own data
   const tasks = await ctx.db
     .query("tasks")
     .filter(q => q.eq(q.field("userId"), user.subject))
     .collect();
   ```

3. **Never trust client input**
   ```typescript
   // Use Convex validators
   export const create = mutation({
     args: { text: v.string() }, // Validates type
     handler: async (ctx, args) => {
       if (args.text.length > 1000) {
         throw new Error("Text too long");
       }
       // ... rest of logic
     }
   });
   ```

4. **Keep `.env*.local` files in `.gitignore`** ✅ (already done)

---

## 📝 Summary

### For Authentication:
- **No secret keys needed** in your code
- **Public URL is safe** to expose
- **Add auth checks** in your Convex functions
- **CLI uses browser auth** for deployments

### For Environment Management:
- `.env.development.local` → Dev environment
- `.env.production.local` → Prod environment (local testing)
- `npm run dev` → Dev
- `npm run dev:prod` → Prod (locally)
- `npm run convex:deploy` → Deploy to prod

### Next Steps:
1. Create `.env.development.local` with your dev URL
2. Create `.env.production.local` with your prod URL
3. Use `npm run dev:prod` to test against production
4. Consider adding authentication for security!

