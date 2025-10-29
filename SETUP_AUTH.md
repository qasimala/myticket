# Quick Auth Setup Guide

## 🎯 You've just implemented Convex Auth!

Here's what you need to do to get started:

---

## 1️⃣ Start the Development Servers

```bash
# Terminal 1: Convex backend (must be running first!)
npm run convex:dev

# Terminal 2: Next.js frontend
npm run dev
```

---

## 2️⃣ Create Your First Account

1. Open http://localhost:3000
2. Click **"Sign In"** button in the header
3. Click **"Don't have an account? Sign up"**
4. Enter:
   - Name (optional)
   - Email
   - Password (minimum 6 characters)
5. Click **"Create Account"**

You're now logged in as a **user**! 🎉

---

## 3️⃣ Promote Yourself to Superadmin

Since this is your first account, you'll want superadmin access:

### Via Convex Dashboard (Easiest):

```bash
npx convex dashboard
```

1. Click on the **"users"** table
2. Find your user (should be the only one)
3. Click on the row to edit
4. Change `role` from `"user"` to `"superadmin"`
5. Save changes

**Refresh your app** - you should now see:
- Your role badge says "superadmin" (purple)
- "Admin Panel" link in the header

---

## 4️⃣ Test the System

### As a User:
1. Create an event
2. Add ticket types
3. Publish the event
4. ✅ You can manage your own events

### As Superadmin:
1. Click **"Admin Panel"** in header
2. See your user listed
3. Try changing roles (create another account first)
4. ✅ You can manage all users and events

---

## 🎭 What You Have Now

### ✅ Authentication
- Sign up / Sign in with email & password
- Secure session management
- User profiles with names and emails

### ✅ Authorization (3 Roles)
- **user** - Create and manage own events
- **admin** - Manage all events, view users
- **superadmin** - Full control, manage user roles

### ✅ Protected Routes
- `/admin` - Only accessible to admins and superadmins
- Event mutations - Only owners or admins can modify
- Ticket mutations - Only event owners or admins

### ✅ UI Components
- Header with user menu
- Auth dialog (sign in/up)
- Admin panel for user management
- Role badges (color-coded)

---

## 🚀 Next Steps

### Add More Admins
1. Have them create accounts
2. Go to Admin Panel (as superadmin)
3. Change their role to "admin" or "superadmin"

### Customize Roles
See [AUTH_GUIDE.md](./AUTH_GUIDE.md) for:
- Adding custom roles
- Modifying permissions
- Creating custom auth flows

### Deploy to Production
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for:
- Deploying with authentication
- Setting up first superadmin in production
- Security best practices

---

## 📝 Quick Reference

### User Flow:
```
Sign Up → Create Events → Add Tickets → Publish → Track Sales
```

### Admin Flow:
```
Sign In → Access Admin Panel → View Users → Manage All Events
```

### Superadmin Flow:
```
Sign In → Admin Panel → Change User Roles → Delete Users
```

---

## 🔒 Security Notes

1. **All auth checks happen server-side** (in Convex)
2. **Users can only modify their own events** (unless admin+)
3. **Superadmins cannot demote themselves** (prevents lockout)
4. **Passwords are hashed** automatically by Convex Auth
5. **Sessions are secure** and managed by Convex

---

## ❓ Troubleshooting

**Can't see Admin Panel link?**
- Check your role is "admin" or "superadmin"
- Refresh the page after changing role

**"Not authenticated" errors?**
- Make sure you're signed in
- Check browser console for errors

**Can't edit an event?**
- Make sure you created it (or you're an admin)
- Check the event's `createdBy` field matches your user ID

---

## 🎉 You're All Set!

Your app now has:
- ✅ Complete authentication
- ✅ Role-based access control
- ✅ User management panel
- ✅ Secure event/ticket management

Read [AUTH_GUIDE.md](./AUTH_GUIDE.md) for detailed documentation!

