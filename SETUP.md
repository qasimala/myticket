# Quick Setup Guide

Follow these steps to get your Next.js + Convex app running:

## Step 1: Install Dependencies (Already Done ✓)

The dependencies are already installed.

## Step 2: Set Up Convex Backend

Run the Convex development server:

```bash
npm run convex:dev
```

This will:
- Prompt you to log in to Convex (create a free account at https://convex.dev if you don't have one)
- Create a new Convex project
- Generate the `convex/_generated/` directory with TypeScript types
- Create a `.env.local` file with your Convex URL

**Keep this terminal window open** - the Convex dev server needs to run continuously.

## Step 3: Start Next.js Development Server

In a **new terminal window**, start the Next.js app:

```bash
npm run dev
```

## Step 4: Open Your App

Visit [http://localhost:3000](http://localhost:3000) in your browser.

You should see a beautiful task manager where you can:
- Add new tasks
- Mark tasks as complete
- Delete tasks
- See real-time updates

## Troubleshooting

### Error: "NEXT_PUBLIC_CONVEX_URL is not defined"

Make sure you've run `npm run convex:dev` first and it has created the `.env.local` file.

### Error: "Cannot find module 'convex/_generated/api'"

The Convex dev server needs to be running to generate the TypeScript types. Make sure `npm run convex:dev` is running in a separate terminal.

### Port 3000 Already in Use

You can run Next.js on a different port:

```bash
npm run dev -- -p 3001
```

## Next Steps

- Explore the code in `app/components/TaskList.tsx` to see how to use Convex queries and mutations
- Check out `convex/tasks.ts` to see how to define backend functions
- Modify `convex/schema.ts` to add more fields to the tasks table
- Build your own features!

## Deployment

When you're ready to deploy:

1. Deploy Convex backend:
   ```bash
   npm run convex:deploy
   ```

2. Deploy Next.js to Vercel:
   - Push your code to GitHub
   - Import on [vercel.com](https://vercel.com)
   - Add the `NEXT_PUBLIC_CONVEX_URL` from your production deployment

