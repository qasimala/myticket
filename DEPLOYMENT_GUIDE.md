# Deployment Guide - How Environment Variables Work

## 🎯 Your Environment Setup

You now have TWO Convex deployments:

### Development
- **URL:** `https://grand-bee-365.convex.cloud`
- **Project:** `myticket-dev`
- **Local File:** `.env.local`

### Production
- **URL:** `https://wooden-reindeer-242.convex.cloud`
- **Project:** `myticket-main`
- **Local File:** `.env.production.local` ✅ (just created!)

---

## 🚀 How Deployment Knows Which URL to Use

Great question! Here's how it works across different environments:

### 1. **Local Development** (Your Computer)

```bash
npm run dev
```

**Uses:** `.env.local` (development URL)
- Next.js automatically loads `.env.local` files
- These files are in `.gitignore` - they NEVER go to production
- Your dev server connects to `grand-bee-365` (dev environment)

### 2. **Local Production Testing** (Your Computer)

```bash
npm run dev:prod
```

**Uses:** `.env.production.local` (production URL)
- When `NODE_ENV=production`, Next.js loads `.env.production.local`
- You can test against your live database locally
- Connects to `wooden-reindeer-242` (production environment)

### 3. **Deployed to Production** (Vercel/Netlify/etc)

This is the KEY part - **your hosting platform needs the environment variable!**

#### How It Works:

1. **Your `.env*.local` files DON'T get deployed** (they're gitignored)
2. **You configure environment variables in your hosting platform**
3. **The hosting platform injects them at build/runtime**

---

## 📋 Setting Up Production Deployment

### Option A: Deploy to Vercel (Recommended for Next.js)

#### Step 1: Push Your Code to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. **IMPORTANT:** Before clicking "Deploy", add environment variables:

#### Step 3: Add Environment Variable in Vercel

In the Vercel project settings:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_CONVEX_URL` | `https://wooden-reindeer-242.convex.cloud` |

**Important Notes:**
- ✅ Use your PRODUCTION URL (wooden-reindeer-242)
- ✅ Set for "Production" environment
- ✅ Optionally set for "Preview" too if you want PR previews to use prod data

#### Step 4: Deploy!

Click "Deploy" and Vercel will:
1. Build your Next.js app
2. Inject `NEXT_PUBLIC_CONVEX_URL` at build time
3. Your app connects to production Convex backend

---

### Option B: Deploy to Netlify

Similar process:

1. Import your GitHub repo to Netlify
2. Go to Site settings → Environment variables
3. Add: `NEXT_PUBLIC_CONVEX_URL` = `https://wooden-reindeer-242.convex.cloud`
4. Deploy!

---

### Option C: Deploy to Your Own Server

If you're building and deploying manually:

```bash
# Set environment variable before building
export NEXT_PUBLIC_CONVEX_URL=https://wooden-reindeer-242.convex.cloud

# Build
npm run build

# Start
npm start
```

Or create a `.env.production` file (without `.local`):
```bash
NEXT_PUBLIC_CONVEX_URL=https://wooden-reindeer-242.convex.cloud
```

Then commit this file (it's safe - it's a public URL).

---

## 🔄 Complete Workflow Example

### Scenario: Adding a New Feature

#### 1. Develop Locally
```bash
# Terminal 1: Start Convex dev server
npx convex dev  # Connects to myticket-dev

# Terminal 2: Start Next.js
npm run dev  # Uses .env.local (dev environment)
```

You work with dev data - safe to experiment!

#### 2. Test Against Production Data (Optional)
```bash
npm run dev:prod  # Uses .env.production.local
```

Verify your feature works with real production data.

#### 3. Deploy Backend to Production
```bash
npm run convex:deploy
```

This pushes your Convex functions to `myticket-main` (wooden-reindeer-242).

#### 4. Deploy Frontend to Production
```bash
git push origin main
```

If connected to Vercel:
- Auto-deploys on push
- Uses environment variable from Vercel settings
- Connects to `https://wooden-reindeer-242.convex.cloud`

---

## 🎨 Environment Variable Precedence

Next.js loads `.env` files in this order (later = higher priority):

1. `.env` - Committed, shared defaults
2. `.env.production` or `.env.development` - Environment-specific
3. `.env.local` - Local overrides (gitignored)
4. `.env.production.local` or `.env.development.local` - Local + environment (gitignored)

**In production (Vercel/Netlify):**
- Platform environment variables take precedence
- `.env*.local` files aren't deployed (gitignored)

---

## ✅ Your Current Setup Checklist

- [x] **Dev environment:** `.env.local` → `grand-bee-365`
- [x] **Prod environment:** `.env.production.local` → `wooden-reindeer-242`
- [x] **Scripts:** `npm run dev` and `npm run dev:prod`
- [ ] **Deploy to hosting platform** (Vercel/Netlify)
- [ ] **Add environment variable in platform settings**

---

## 📝 Quick Reference Commands

### Local Development
```bash
# Work with dev database
npm run dev

# Test against production database
npm run dev:prod
```

### Deployment
```bash
# Deploy Convex backend to production
npm run convex:deploy

# Deploy frontend (varies by platform)
git push origin main  # If using Vercel/Netlify auto-deploy
# OR
npm run build && npm start  # Manual deployment
```

### Check Your Environments
```bash
# See current dev environment
Get-Content .env.local

# See current prod environment
Get-Content .env.production.local

# Open Convex dashboard
npx convex dashboard
```

---

## 🛡️ Security Reminders

### ✅ Safe to Expose Publicly:
- `NEXT_PUBLIC_CONVEX_URL` - It's designed to be public!
  - Goes in client-side code
  - No direct database access through it
  - All access through your defined Convex functions
  - Reference: [Convex Docs](https://docs.convex.dev/)

### ⚠️ Keep Secret:
- Files in `.gitignore`:
  - `.env*.local` files (local dev config)
  - `~/.convex/config.json` (your personal auth token)
  - `convex/_generated/` (auto-generated types)

### 📤 Can Commit (Optional):
- `.env.production` - If you want to share prod URL with team
- `env.template` - Template for others to fill in

---

## 🎯 Summary

**Q: How does deployment know which URL to use?**

**A:** Three ways:

1. **Local dev:** Reads `.env.local` (dev URL)
2. **Local prod testing:** Reads `.env.production.local` (prod URL)
3. **Deployed to hosting:** Uses environment variables you set in platform dashboard

The `.env*.local` files are just for YOUR local machine. When you deploy to Vercel/Netlify/etc, you configure the environment variable in their dashboard, and they inject it at build time.

**Your production URL to use in Vercel:**
```
NEXT_PUBLIC_CONVEX_URL=https://wooden-reindeer-242.convex.cloud
```

That's it! 🚀

