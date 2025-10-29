# What Happens When You Run `npm run convex:deploy`

## 🚀 The Command

```bash
npm run convex:deploy
```

This runs: `convex deploy` (from your package.json)

---

## 📋 Step-by-Step Process

### 1. **Authentication**
```
✓ Checking credentials...
```
- Reads your auth token from `C:\Users\QASIM\.convex\config.json`
- Verifies you're logged in to Convex
- If not logged in, prompts you to authenticate

### 2. **Determines Target Deployment**
```
✓ Targeting production deployment...
```
- Looks for your production Convex project
- By default, `convex deploy` targets **production**
- Uses your team/project from when you first set up Convex

**Important:** It deploys to `myticket-main` (wooden-reindeer-242), NOT your dev environment!

### 3. **Analyzes Your Convex Code**
```
✓ Analyzing convex/ directory...
```
- Scans all files in `convex/` folder:
  - `convex/schema.ts` - Your database schema
  - `convex/tasks.ts` - Your queries and mutations
  - Any other `.ts` files you've added
- TypeScript compilation and validation

### 4. **Schema Migration**
```
✓ Checking schema changes...
```
- Compares your new schema with existing production schema
- If tables/fields changed:
  - Migrates existing data automatically
  - Preserves all existing data
  - Adds new tables/fields as needed

**Example:** If you add a new field to tasks:
```typescript
// Before
tasks: defineTable({
  text: v.string(),
  isCompleted: v.boolean(),
})

// After - adding userId
tasks: defineTable({
  text: v.string(),
  isCompleted: v.boolean(),
  userId: v.string(), // NEW FIELD
})
```
- Convex adds the new field
- Existing tasks remain (userId will be undefined for old tasks)

### 5. **Deploys Functions**
```
✓ Uploading functions...
  - tasks:get (query)
  - tasks:create (mutation)
  - tasks:toggle (mutation)
  - tasks:remove (mutation)
```
- Bundles all your queries and mutations
- Uploads them to production
- **Zero downtime deployment** - old functions work until new ones are ready
- Instantly available to clients

### 6. **Generates Production Types**
```
✓ Generating production types...
```
- Updates `convex/_generated/` based on production schema
- Ensures type safety matches your deployed backend

### 7. **Completion**
```
✅ Deployment complete!
   Production URL: https://wooden-reindeer-242.convex.cloud
```

---

## 🎯 What Actually Changes

### What Gets Deployed:
- ✅ **Convex functions** (queries, mutations, actions in `convex/`)
- ✅ **Database schema** (from `convex/schema.ts`)
- ✅ **Function logic** - any code changes you made

### What Doesn't Get Deployed:
- ❌ **Your Next.js frontend** - that's separate!
- ❌ **Frontend components** (app/* files)
- ❌ **Environment variables** (.env files)
- ❌ **Your database data** - existing data stays intact

### Data Implications:
- 🔒 **Existing data is preserved** - all your tasks, users, etc. remain
- ✨ **Schema migrations are automatic** - Convex handles it safely
- ⚡ **No downtime** - users can keep using your app during deployment

---

## 🔄 Dev vs Prod Deployment

| Command | Target | What It Does |
|---------|--------|--------------|
| `npx convex dev` | **Development** (grand-bee-365) | Watches files, auto-deploys changes, hot reload |
| `npm run convex:deploy` | **Production** (wooden-reindeer-242) | One-time deployment to production |

### Important Distinction:

```bash
# Development: Auto-deploys on file save
npx convex dev
# Watches convex/ folder
# Every time you save a file, it deploys to DEV
# Keeps running until you stop it

# Production: Manual deployment
npm run convex:deploy
# Deploys once to PRODUCTION
# Returns when complete
# Run this when you're ready to ship to users
```

---

## ⚠️ Before Running `npm run convex:deploy`

### Pre-Flight Checklist:

1. **Test Your Changes Locally**
   ```bash
   # Make sure dev works
   npm run dev
   ```

2. **Test Against Production Data** (Optional but recommended)
   ```bash
   # Test with prod database
   npm run dev:prod
   ```

3. **Review Your Changes**
   - Check `convex/schema.ts` - any breaking changes?
   - Check `convex/tasks.ts` - functions work as expected?
   - Any new dependencies?

4. **Consider Your Users**
   - Will schema changes break existing clients?
   - Do you need to deploy frontend at the same time?
   - Any data migrations needed?

---

## 🎭 Common Scenarios

### Scenario 1: Adding a New Function

**You add:**
```typescript
// convex/tasks.ts
export const clearCompleted = mutation({
  handler: async (ctx) => {
    const completed = await ctx.db
      .query("tasks")
      .filter(q => q.eq(q.field("isCompleted"), true))
      .collect();
    
    for (const task of completed) {
      await ctx.db.delete(task._id);
    }
  },
});
```

**Run:**
```bash
npm run convex:deploy
```

**Result:**
- New function `clearCompleted` available in production
- No impact on existing functions or data
- Frontend can immediately call it

### Scenario 2: Modifying Schema

**You change:**
```typescript
// convex/schema.ts
tasks: defineTable({
  text: v.string(),
  isCompleted: v.boolean(),
  priority: v.string(), // NEW FIELD
})
```

**Run:**
```bash
npm run convex:deploy
```

**Result:**
- New `priority` field added to tasks table
- Existing tasks: `priority` will be `undefined`
- New tasks: can set priority
- **No data loss!**

### Scenario 3: Breaking Change

**You remove a field:**
```typescript
// Before
tasks: defineTable({
  text: v.string(),
  isCompleted: v.boolean(),
  tags: v.array(v.string()), // Let's remove this
})

// After
tasks: defineTable({
  text: v.string(),
  isCompleted: v.boolean(),
  // tags removed
})
```

**Run:**
```bash
npm run convex:deploy
```

**Result:**
- ⚠️ `tags` field still exists in database (Convex doesn't delete data)
- Old clients trying to access `tags` may break
- **Better approach:** Keep field in schema but mark optional, or migrate data first

---

## 🔍 Monitoring the Deployment

### During Deployment:

Watch the console output:
```bash
$ npm run convex:deploy

> convex deploy

Preparing deployment to prod:wooden-reindeer-242...
  ✓ Loaded configuration
  ✓ Compiled TypeScript
  ✓ Validated schema
  ✓ Uploading functions
    - tasks:get
    - tasks:create
    - tasks:toggle  
    - tasks:remove
  ✓ Deployment complete!
  
  🚀 Production: https://wooden-reindeer-242.convex.cloud
  📊 Dashboard: https://dashboard.convex.dev/...
```

### After Deployment:

Check the dashboard:
```bash
npx convex dashboard
```

You can see:
- Function logs and errors
- Performance metrics
- Database contents
- Recent deployments

---

## 🚨 What If Something Goes Wrong?

### If Deployment Fails:

**Common issues:**

1. **TypeScript errors:**
   ```
   ❌ Error: Type 'string' is not assignable to type 'number'
   ```
   Fix your TypeScript errors in `convex/` files

2. **Schema validation errors:**
   ```
   ❌ Error: Invalid schema definition
   ```
   Check `convex/schema.ts` syntax

3. **Authentication failed:**
   ```
   ❌ Error: Not authenticated
   ```
   Run `npx convex dev` first to log in

### Rollback:

Convex keeps deployment history. From the dashboard, you can:
- View previous deployments
- See what changed in each deployment
- Monitor for errors in production

**Note:** Convex doesn't have one-click rollback of functions, but you can:
1. Revert your code changes locally
2. Run `npm run convex:deploy` again

---

## 📊 Deployment Flow Chart

```
npm run convex:deploy
         ↓
   Check Auth Token
         ↓
   Target: Production (wooden-reindeer-242)
         ↓
   Compile TypeScript
         ↓
   Validate Schema
         ↓
   Upload Functions ──→ Zero Downtime Switch
         ↓
   Migrate Schema (if needed)
         ↓
   Generate Types
         ↓
   ✅ DONE - Backend Updated!
         
   Your Next.js app connects automatically
   (using NEXT_PUBLIC_CONVEX_URL)
```

---

## 🎯 Complete Deployment Workflow

### 1. Backend Changes:
```bash
# Deploy Convex functions to production
npm run convex:deploy
```
✅ Backend is now live at `https://wooden-reindeer-242.convex.cloud`

### 2. Frontend Changes:
```bash
# Push to GitHub (if using Vercel)
git add .
git commit -m "Add new feature"
git push origin main
```
✅ Vercel auto-deploys and connects to production Convex URL

### Important:
- Convex deployment is **separate** from Next.js deployment
- Convex backend = `npm run convex:deploy`
- Next.js frontend = Deploy to Vercel/Netlify/etc.
- They connect via `NEXT_PUBLIC_CONVEX_URL`

---

## 📝 Quick Reference

### Deploy Backend:
```bash
npm run convex:deploy
```
Deploys to: `wooden-reindeer-242.convex.cloud` (production)

### Deploy Frontend:
```bash
git push  # If using Vercel auto-deploy
# OR
npm run build && npm start  # Manual deployment
```

### View Deployment:
```bash
npx convex dashboard
```

---

## 🎓 Key Takeaways

1. **`npm run convex:deploy` only deploys your Convex backend** (not Next.js)
2. **Targets production** (wooden-reindeer-242), not dev (grand-bee-365)
3. **Zero downtime** - users keep working during deployment
4. **Data is preserved** - schema migrations are automatic and safe
5. **Frontend deployment is separate** - deploy to Vercel/Netlify after
6. **Instant availability** - new functions work immediately after deploy

Your workflow:
1. Develop with `npx convex dev` (dev environment)
2. Test with `npm run dev` (dev environment)
3. When ready: `npm run convex:deploy` (production backend)
4. Then deploy frontend to Vercel (production frontend)

Both connect to the same production Convex URL! 🚀

