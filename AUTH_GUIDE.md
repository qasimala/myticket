# Authentication & Authorization Guide

Complete guide to the role-based authentication system in MyTicket.

---

## 🔐 Overview

MyTicket uses **Convex Auth** with a 3-tier role system:
- **user** - Regular users (default)
- **admin** - Event managers with elevated permissions
- **superadmin** - Full system access

---

## 🎭 Roles & Permissions

### User Role (default)
**Capabilities:**
- ✅ Create events
- ✅ Manage own events
- ✅ Add/edit/delete tickets for own events
- ✅ View all published events
- ❌ Cannot manage other users' events
- ❌ Cannot access admin panel

### Admin Role
**Capabilities:**
- ✅ Everything users can do
- ✅ Manage **all events** (any user's)
- ✅ Manage **all tickets**
- ✅ View user list in admin panel
- ❌ Cannot change user roles
- ❌ Cannot delete users

### Superadmin Role
**Capabilities:**
- ✅ Everything admins can do
- ✅ Change user roles (promote/demote)
- ✅ Delete user accounts
- ✅ Full system control
- ⚠️ Cannot demote themselves
- ⚠️ Cannot delete their own account

---

## 🚀 Getting Started

### 1. Create Your First Account

When you run the app for the first time:

```bash
# Terminal 1
npm run convex:dev

# Terminal 2
npm run dev
```

1. Open http://localhost:3000
2. Click "Sign In"
3. Click "Don't have an account? Sign up"
4. Enter your details
5. You'll be logged in as a **user**

### 2. Promote Yourself to Superadmin

Since this is the first account, manually promote it to superadmin:

**Option A: Via Convex Dashboard**
```bash
npx convex dashboard
```
1. Navigate to "users" table
2. Find your user
3. Change `role` field to `"superadmin"`

**Option B: Via Console (in browser DevTools)**
```javascript
// This is just for initial setup!
// In production, you'd set this up differently
```

---

## 🔧 How It Works

### Backend Protection

Every mutation that modifies data checks permissions:

```typescript
// Example from convex/events.ts
export const create = mutation({
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireRole(ctx, ["user", "admin", "superadmin"]);
    
    // User is authenticated and has required role
    // Proceed with operation...
  },
});
```

### Permission Checks

**Owner-based permissions:**
```typescript
// User can only modify their own events
if (event.createdBy !== user._id && 
    user.role !== "admin" && 
    user.role !== "superadmin") {
  throw new Error("Permission denied");
}
```

**Role-based permissions:**
```typescript
// Only admins and superadmins can access
await requireAdmin(ctx);

// Only superadmins can access
await requireSuperAdmin(ctx);
```

---

## 📊 Database Schema

### Users Table

```typescript
{
  name?: string;           // Optional display name
  email: string;           // Unique email
  role: "user" | "admin" | "superadmin";  // User role
  createdAt: number;       // Timestamp
}
```

### Events Table (Updated)

```typescript
{
  name: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string;
  status: "draft" | "published" | "cancelled";
  createdAt: number;
  createdBy: Id<"users">;  // 👈 NEW: References user who created it
}
```

---

## 🎯 User Workflows

### Regular User Workflow

1. **Sign Up/Sign In**
2. **Create Event** → Automatically owned by you
3. **Add Ticket Types** → Only for your events
4. **Publish Event** → Make it live
5. **Manage Sales** → Track ticket sales

### Admin Workflow

Everything users can do, plus:

1. **Access Admin Panel** → Click "Admin Panel" in header
2. **View All Users** → See complete user list
3. **Manage Any Event** → Edit/delete any event
4. **Monitor System** → Overview of all activities

### Superadmin Workflow

Everything admins can do, plus:

1. **Promote Users** → Change roles via dropdown in admin panel
2. **Demote Admins** → Remove elevated permissions
3. **Delete Accounts** → Remove users and their events
4. **System Control** → Full access

---

## 🎨 UI Components

### Header Component

Shows:
- User avatar with initials
- User name and email
- Role badge (color-coded)
- Sign out button
- Admin panel link (for admins/superadmins)

### Auth Dialog

Modal for:
- Sign in with email/password
- Sign up (new account)
- Toggle between sign in/up
- Error handling

### Admin Panel

Table showing:
- All users
- Email addresses
- Current roles
- Join dates
- Role management dropdown (superadmin only)
- Delete user button (superadmin only)

---

## 🔒 Security Features

### 1. Server-Side Validation
All auth checks happen in Convex functions (backend), not frontend.

### 2. Owner Verification
Users can only modify resources they own (unless admin+).

### 3. Role Hierarchy
```
superadmin > admin > user
```

### 4. Self-Protection
- Cannot demote yourself from superadmin
- Cannot delete your own account
- Prevents accidental lockout

### 5. Cascade Deletion
Deleting a user also deletes:
- All their events
- All tickets for those events

---

## 📝 API Reference

### User Functions (`convex/users.ts`)

| Function | Access | Description |
|----------|--------|-------------|
| `current` | Public | Get current logged-in user |
| `list` | Admin+ | List all users |
| `updateRole` | Superadmin | Change user's role |
| `updateProfile` | Self | Update own profile |
| `remove` | Superadmin | Delete user account |

### Helper Functions

| Function | Purpose |
|----------|---------|
| `getCurrentUser(ctx)` | Get current user or null |
| `requireRole(ctx, roles[])` | Require specific role(s) |
| `requireAdmin(ctx)` | Require admin or superadmin |
| `requireSuperAdmin(ctx)` | Require superadmin only |

---

## 🚨 Common Scenarios

### Scenario 1: User Creates Event

```
1. User clicks "Create New Event"
2. Fills in details
3. Submits form
4. Backend: requireRole(ctx, ["user", "admin", "superadmin"])
5. Backend: Sets createdBy = user._id
6. Event created and owned by user
```

### Scenario 2: User Tries to Edit Others' Event

```
1. User tries to update event
2. Backend checks: event.createdBy === user._id?
3. No? Check if admin/superadmin
4. No? → Throw error: "Permission denied"
5. Yes? → Allow update
```

### Scenario 3: Superadmin Promotes User

```
1. Superadmin opens admin panel
2. Clicks role dropdown for target user
3. Selects "admin"
4. Backend: requireSuperAdmin(ctx)
5. Backend: Checks not demoting self
6. Backend: Updates user.role = "admin"
7. User now has admin permissions
```

---

## 🛠️ Customization

### Adding New Roles

1. Update schema:
```typescript
// convex/schema.ts
role: v.union(
  v.literal("user"),
  v.literal("admin"),
  v.literal("superadmin"),
  v.literal("moderator")  // NEW ROLE
),
```

2. Update helper functions:
```typescript
// convex/users.ts
export async function requireModerator(ctx) {
  return await requireRole(ctx, ["moderator", "admin", "superadmin"]);
}
```

3. Update UI badges:
```typescript
// app/components/Header.tsx
case "moderator":
  return "bg-green-100 text-green-800";
```

### Custom Permissions

Example: Events require approval before publishing

```typescript
// convex/events.ts
export const publish = mutation({
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const event = await ctx.db.get(args.id);
    
    // Custom logic: Only admins can publish
    if (user.role !== "admin" && user.role !== "superadmin") {
      throw new Error("Events must be approved by an admin");
    }
    
    await ctx.db.patch(args.id, { status: "published" });
  },
});
```

---

## 🔍 Debugging

### Check Current User

In browser console:
```javascript
// Available via React DevTools or Convex dashboard
```

### View Database

```bash
npx convex dashboard
```
Navigate to tables to see:
- users (roles, emails)
- events (createdBy field)
- authSessions (active sessions)

### Common Issues

**Issue: "Not authenticated" error**
- Solution: Make sure you're signed in

**Issue: "Permission denied" on own event**
- Solution: Check event.createdBy matches your user ID
- Could be database inconsistency

**Issue: Can't access admin panel**
- Solution: Check your role is "admin" or "superadmin"

---

## 🚀 Production Deployment

### Environment Variables

Already set up! No additional env vars needed.
- `NEXT_PUBLIC_CONVEX_URL` - Already configured

### First Superadmin Setup

**Option 1: Via Dashboard (Recommended)**
1. Deploy to production
2. Create first account via UI
3. Open Convex dashboard
4. Manually set role to "superadmin"

**Option 2: Seed Script**
Create a setup script that runs once:
```typescript
// convex/setup.ts
export const createFirstSuperadmin = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("users").first();
    if (!existing) {
      // Create superadmin account
    }
  },
});
```

---

## 📚 Best Practices

1. **Always check permissions server-side** - Never trust client
2. **Use helper functions** - Don't duplicate permission logic
3. **Test with different roles** - Create test accounts for each role
4. **Audit trail** - Consider adding logs for sensitive actions
5. **Principle of least privilege** - Start users with minimal permissions

---

## ✅ Testing Checklist

- [ ] User can sign up and sign in
- [ ] User can create events
- [ ] User cannot edit others' events
- [ ] Admin can edit all events
- [ ] Superadmin can access admin panel
- [ ] Superadmin can change roles
- [ ] Superadmin cannot demote self
- [ ] Deleting user removes their events
- [ ] Unauthenticated users see sign-in prompt

---

## 🎓 Summary

Your MyTicket app now has:
- ✅ **Full authentication** with email/password
- ✅ **3-tier role system** (user, admin, superadmin)
- ✅ **Owner-based permissions** (users own their events)
- ✅ **Admin panel** for user management
- ✅ **Role-based access control** throughout the app
- ✅ **Protected routes** and secure mutations
- ✅ **Beautiful UI** with role badges and user menus

Users can create events, admins can manage everything, and superadmins control the system! 🚀

