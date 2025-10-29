# Setting Up Separate Dev and Production Environments

You have two options for managing dev and production environments with Convex:

## Option 1: Use Two Separate Convex Projects (Recommended)

This gives you completely isolated dev and production databases.

### Step 1: Create a New Dev Project

1. Create a new Convex project for development:
```bash
npx convex dev --project myticket-dev --configure=new
```

This will:
- Create a new Convex project called "myticket-dev"
- Update your `.env.local` to point to the dev deployment
- Generate the necessary types

### Step 2: Switch Between Environments

**For development:**
```bash
# Start Convex dev server (uses .env.local)
npm run convex:dev

# In another terminal, start Next.js
npm run dev
```

**For production:**
```bash
# Work with production deployment
npm run convex:prod

# Or deploy to production
npm run convex:deploy
```

### Step 3: Manage Environment Files

You can create separate environment files:

**.env.local** (for development - already in .gitignore)
```bash
CONVEX_DEPLOYMENT=dev:project-name-123
NEXT_PUBLIC_CONVEX_URL=https://project-name-123.convex.cloud
```

**.env.production.local** (for production builds)
```bash
CONVEX_DEPLOYMENT=prod:project-name-456
NEXT_PUBLIC_CONVEX_URL=https://project-name-456.convex.cloud
```

---

## Option 2: Use Dev and Prod Deployments in Same Project

Use the same Convex project but with separate dev/prod deployments.

### Current Setup (Production)

Your current environment is already set up as production. To work with it:

```bash
npm run convex:prod
```

### Create Dev Deployment

1. Stop any running Convex processes

2. Create/switch to dev deployment:
```bash
npx convex dev --configure
```

Select your existing project but choose the **dev** deployment.

This will update `.env.local` to point to dev.

### Switching Between Them

**Development workflow:**
```bash
# Terminal 1: Start Convex dev server
npm run convex:dev

# Terminal 2: Start Next.js
npm run dev
```

**Production workflow:**
```bash
# Deploy to production
npm run convex:deploy

# Or test production locally
npm run convex:prod
```

---

## Recommended Approach

I recommend **Option 1** (separate projects) because:
- ✅ Complete data isolation
- ✅ Can't accidentally affect production data
- ✅ Easier to understand and manage
- ✅ Free for both environments on Convex's free tier

---

## Quick Command Reference

| Command | Description |
|---------|-------------|
| `npm run convex:dev` | Start Convex dev server (uses .env.local) |
| `npm run convex:prod` | Work with production deployment |
| `npm run convex:deploy` | Deploy to production |
| `npx convex dev --project myticket-dev --configure=new` | Create new dev project |
| `npx convex dashboard` | Open Convex dashboard in browser |

---

## Next Steps

1. Decide which option you prefer
2. If using Option 1, run:
   ```bash
   npx convex dev --project myticket-dev --configure=new
   ```
3. This will create your dev environment and you're ready to go!

Your production deployment (myticket-main) will remain untouched.

