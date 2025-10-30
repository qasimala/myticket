# Easypanel Deployment Guide

This guide will help you deploy your MyTicket app to Easypanel with Docker.

## 📋 Prerequisites

1. **Deploy Convex Backend to Dev Environment**

   ```bash
   # Make sure Convex dev server is running or deploy to dev
   npm run convex:dev
   ```

   This ensures your Convex functions are deployed to the dev environment. Your dev URL is: `https://grand-bee-365.convex.cloud`

2. **Get Your Dev Convex URL**
   ```bash
   npx convex dashboard
   ```
   Or check your `.env.local` file for `NEXT_PUBLIC_CONVEX_URL`

## 🚀 Step-by-Step Deployment

### Step 1: Configure Environment Variables in Easypanel

**⚠️ Deploying DEV Environment for Testing**

In your Easypanel project settings, add these environment variables:

| Variable                 | Description                   | Value                                |
| ------------------------ | ----------------------------- | ------------------------------------ |
| `NEXT_PUBLIC_CONVEX_URL` | Your **dev** Convex URL       | `https://grand-bee-365.convex.cloud` |
| `QR_SECRET`              | Secret for QR code generation | Your secret value                    |
| `NODE_ENV`               | Node environment              | `production`                         |
| `PORT`                   | Port to run on                | `3000`                               |

**Where to add these:**

- Look for "Environment Variables", "Variables", or "Env" section in your Easypanel app settings
- Add all four variables listed above

**Important:** Easypanel should automatically pass these as Docker build arguments (needed for `NEXT_PUBLIC_*` variables to work). If your build fails with missing `NEXT_PUBLIC_CONVEX_URL`, check if Easypanel has a separate "Build Arguments" section and add it there too.

### Step 2: Configure Build Settings in Easypanel

1. **Build Context:** `/` (root of repository)
2. **Dockerfile Path:** `Dockerfile` (if Easypanel asks for it)
3. **Environment Variables:** Make sure they're added as shown in Step 1

### Step 3: Configure Container Settings

- **Port:** `3000`
- **Expose Port:** Yes (if you want external access)
- **Health Check Path:** `/api/health` (if Easypanel asks for it)
- **Health Check Port:** `3000`

### Step 4: Deploy!

1. Push your code to GitHub
2. Easypanel will automatically build and deploy when connected to your repo
3. Or manually trigger a deployment from Easypanel dashboard

## 🔄 Two-Step Deployment Process

Remember: **Convex backend and Next.js frontend deploy separately!**

### 1. Deploy Convex Backend to Dev (when you change backend code)

```bash
# Start the Convex dev server - it auto-deploys changes
npm run convex:dev
```

This watches your `convex/` folder and automatically deploys changes to the dev environment (`grand-bee-365`).

**Note:** Keep `npm run convex:dev` running while developing. Changes are deployed automatically when you save files.

### 2. Deploy Frontend (when you change frontend code)

Push to GitHub → Easypanel auto-deploys

## 🔍 Verification

After deployment:

1. **Check that the app loads:** Visit your Easypanel app URL
2. **Check health endpoint:** Visit `https://your-app-url/api/health` - should return `{"status":"ok"}`
3. **Verify Convex connection:** Open browser DevTools → Network tab → Look for connections to your Convex URL
4. **Check logs:** In Easypanel, check container logs for any errors

## 🐛 Troubleshooting

### Issue: "Cannot connect to Convex"

**Solution:**

- Verify `NEXT_PUBLIC_CONVEX_URL` is set correctly in Easypanel (should be `https://grand-bee-365.convex.cloud` for dev)
- Check that the URL matches your dev Convex deployment
- Run `npx convex dashboard` to verify the dev URL
- Make sure `npm run convex:dev` is running (or has been run recently) to ensure dev backend is deployed

### Issue: Build fails with "Cannot find module"

**Solution:**

- Make sure Convex types are generated: Run `npx convex codegen` locally
- Commit the `convex/_generated/` folder (it's currently not gitignored)
- Push to GitHub and rebuild

### Issue: Build fails with missing `NEXT_PUBLIC_CONVEX_URL` or "ARG NEXT_PUBLIC_CONVEX_URL is not provided"

**Solution:**

This means Easypanel isn't automatically passing environment variables as build arguments. Try:

1. **Check if Easypanel has a "Build Arguments" section:**
   - Look for "Build Args", "Build Arguments", or "Docker Build Args" in your app settings
   - Add `NEXT_PUBLIC_CONVEX_URL` and `QR_SECRET` there explicitly

2. **Or check Easypanel's Docker build settings:**
   - Some versions require explicitly mapping env vars to build args
   - The build command should include: `--build-arg NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL`

3. **If still not working:**
   - Contact Easypanel support or check their documentation for Docker build arguments
   - The Dockerfile expects these as build arguments for Next.js `NEXT_PUBLIC_*` variables to work

### Issue: "Service is not reachable" / Health check failing

**Solution:**

1. **Check if the app is actually running:**
   - Look at Easypanel logs - you should see "Ready in Xms"
   - The app might be starting but health check is failing

2. **Verify health endpoint:**
   - Try accessing `/api/health` directly: `https://your-app-url/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

3. **Check Easypanel health check settings:**
   - Make sure health check path is set to `/api/health` or `/`
   - Verify port is set to `3000`
   - Health check should hit the root path `/` or `/api/health`

4. **Verify container is listening on correct interface:**
   - The Dockerfile sets `HOSTNAME="0.0.0.0"` to listen on all interfaces
   - Make sure `PORT=3000` is set as an environment variable

5. **Wait a bit:**
   - Next.js might take 30-60 seconds to fully start
   - Check logs to see when it says "Ready"

### Issue: Types are out of date

**Solution:**

```bash
# 1. Make sure you're connected to production
npm run convex:prod

# 2. Generate types
npx convex codegen

# 3. Commit and push
git add convex/_generated/
git commit -m "Update Convex types"
git push
```

## 📝 Important Notes

1. **Environment Variables:**
   - ⚠️ **This deployment uses DEV environment** (`grand-bee-365`) for testing
   - Set `NEXT_PUBLIC_CONVEX_URL` to `https://grand-bee-365.convex.cloud` (dev URL)
   - Keep `npm run convex:dev` running so dev backend stays updated

2. **Convex Types:**
   - The `convex/_generated/` folder is committed to git
   - If you update Convex functions, regenerate types locally before deploying:
     ```bash
     npm run convex:dev  # Ensures dev backend is running
     npx convex codegen  # Generate types from dev deployment
     git add convex/_generated/ && git commit -m "Update types" && git push
     ```

3. **Security:**
   - `NEXT_PUBLIC_CONVEX_URL` is safe to expose (it's public by design)
   - `QR_SECRET` should be kept secret - use Easypanel's secret management
   - ⚠️ **Dev environment data is for testing only** - don't use real production data

## 🎯 Quick Reference

### Get Dev Convex URL

```bash
npx convex dashboard
# Or check .env.local file
```

### Keep Dev Backend Running

```bash
npm run convex:dev
# Keep this running - it auto-deploys changes to dev environment
```

### Regenerate Types (after backend changes)

```bash
npm run convex:dev  # Ensure dev backend is running
npx convex codegen  # Generate types from dev deployment
git add convex/_generated/ && git commit -m "Update types" && git push
```

### Check Dev Deployment Status

```bash
npx convex dashboard
```

## ✅ Checklist Before Deploying (DEV Environment)

- [ ] Convex dev backend running (`npm run convex:dev`) - keep this running!
- [ ] Dev Convex URL noted: `https://grand-bee-365.convex.cloud`
- [ ] Environment variables configured in Easypanel (using **dev** URL)
- [ ] Convex types are up to date (run `npx convex codegen` if needed)
- [ ] Code pushed to GitHub
- [ ] Easypanel connected to GitHub repo
- [ ] All environment variables set in Easypanel (with dev URL)

---

## 🔄 Switching to Production Later

When you're ready to deploy to production:

1. Deploy Convex backend to production:

   ```bash
   npm run convex:deploy
   ```

2. Update Easypanel environment variables:
   - Change `NEXT_PUBLIC_CONVEX_URL` to your production URL (e.g., `https://pastel-canary-165.convex.cloud`)
   - Get production URL: `npx convex dashboard --prod`

3. Redeploy in Easypanel with the new environment variables

---

**Need help?** Check the Convex dashboard: `npx convex dashboard` (for dev)
