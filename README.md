# MyTicket - Next.js + Convex App

A modern task management application built with Next.js and Convex backend.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

### Setting up Convex

1. Sign up for a free Convex account at [https://convex.dev](https://convex.dev)

2. Run the Convex development server:

```bash
npx convex dev
```

This will:
- Prompt you to log in to your Convex account
- Create a new Convex project (or link to an existing one)
- Generate the necessary configuration files
- Create a `.env.local` file with your `NEXT_PUBLIC_CONVEX_URL`
- Generate TypeScript types in `convex/_generated/`

3. Keep the Convex dev server running in one terminal

### Running the Development Server

In a separate terminal, start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## Project Structure

```
├── app/
│   ├── components/
│   │   └── TaskList.tsx          # Main task list component
│   ├── ConvexClientProvider.tsx  # Convex provider wrapper
│   ├── layout.tsx                # Root layout with Convex provider
│   └── page.tsx                  # Home page
├── convex/
│   ├── schema.ts                 # Database schema definition
│   ├── tasks.ts                  # Task-related queries and mutations
│   └── tsconfig.json             # TypeScript config for Convex
└── README.md
```

## Features

- ✅ Create new tasks
- ✅ Mark tasks as complete/incomplete
- ✅ Delete tasks
- ✅ Real-time updates across all clients
- ✅ Beautiful, responsive UI with Tailwind CSS

## Technologies Used

- **Next.js 15** - React framework with App Router
- **Convex** - Backend-as-a-Service for real-time data
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add your `NEXT_PUBLIC_CONVEX_URL` environment variable
4. Deploy!

### Deploy Convex to Production

```bash
npx convex deploy
```

This will give you a production Convex URL to use in your Vercel deployment.
