# How to Promote Yourself to Superadmin

## Quick Method (Command Line)

Replace `your-email@example.com` with the email you signed up with:

```bash
npx convex run setupAdmin:makeSuperAdmin '{"email":"your-email@example.com"}'
```

This will automatically:
- Find your user account
- Create or update your profile
- Set your role to "superadmin"

Then **refresh your browser** and you should see:
- Purple "superadmin" badge in header
- "Admin Panel" option in sidebar
- Full admin access

---

## Alternative: Via Dashboard

1. Open dashboard:
   ```bash
   npx convex dashboard
   ```

2. Go to **"userProfiles"** table (left sidebar)

3. Find your profile row

4. Click to edit

5. Change `role` field to `"superadmin"` (with quotes)

6. Save

7. Refresh browser

---

## Troubleshooting

### No userProfiles at all?

Run this to create profiles for existing users:

```bash
npx convex run setupAdmin:createMissingProfiles
```

### Still not showing in UI?

Check browser console (F12) for errors, or:

1. Make sure Convex dev server is running: `npm run convex:dev`
2. Make sure Next.js is running: `npm run dev`
3. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Check the Network tab to see if the query is returning your user data

---

## What You Should See After Promotion

**In Header:**
- Your avatar/initials
- Your name
- Purple "superadmin" badge

**In Sidebar:**
- Events
- My Events
- Create Event
- --- (divider)
- Admin Panel (new!)

**On Admin Panel Page:**
- List of all users
- Ability to change roles
- Ability to delete users

