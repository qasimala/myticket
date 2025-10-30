# Migrating Existing Users

This guide explains how to handle users who signed up before we added Name, ID, Phone, and Email fields to the signup process.

## Current Situation

Users who signed up before the update will have:

- ✅ Profile created (via `afterUserCreatedOrUpdated` callback)
- ✅ Name (from auth user, if provided)
- ❌ ID (missing)
- ❌ Phone (missing)
- ✅ Email (from auth user)

## Solutions

### Option 1: Let Users Fill It In Themselves (Recommended)

**How it works:**

- Existing users can checkout normally - they'll just need to fill in the required fields
- A warning message appears at checkout if their profile is incomplete
- Users can visit `/profile` to update their information for future checkouts

**Advantages:**

- No manual work required
- Users control their own data
- Privacy-friendly

**User Experience:**

1. User goes to checkout
2. Sees a yellow warning if profile is incomplete
3. Fills in Name, ID, Phone, Email fields (prefilled if available)
4. Completes checkout
5. Can optionally visit Profile Settings to save info for next time

### Option 2: Migration Script (For Bulk Updates)

If you want to migrate existing users' names from the auth table:

```bash
# As a superadmin, run this mutation
npx convex run users:migrateExistingProfiles
```

This will:

- Copy names from auth users table to profiles (if missing)
- Only works if you're logged in as superadmin
- Won't add ID/Phone (users must provide those themselves)

### Option 3: Manual Updates via Dashboard

1. Open Convex Dashboard:

   ```bash
   npx convex dashboard
   ```

2. Go to `userProfiles` table

3. Edit each user profile manually and add:
   - `id`: string (optional)
   - `phone`: string (optional)

**Note:** This is tedious for many users. Better to let users fill it themselves.

## Profile Settings Page

Users can now update their profile at `/profile`:

- Accessible via sidebar → User menu → "Profile Settings"
- Updates Name, ID, Phone
- Email is read-only (managed by auth system)
- Changes are saved and will prefill checkout forms

## Checkout Behavior

The checkout form:

- ✅ Prefills fields from user profile if available
- ✅ Shows warning if profile is incomplete
- ✅ Requires all fields (Name, ID, Phone, Email) to proceed
- ✅ Links to profile page for easy updates

## Best Practice

**For existing users:**

1. Let them fill in the fields during their first checkout
2. They'll see the warning, fill it in, and complete checkout
3. Optionally, prompt them to update their profile after checkout

**For new users:**

- All fields are collected during signup
- Profile is automatically saved
- Checkout will be instant (all fields prefilled)

## Testing

To test with an existing user account:

1. Sign in with an old account (one without ID/Phone)
2. Add items to cart
3. Go to checkout
4. Verify:
   - Warning message appears
   - Name/Email prefilled (if available)
   - ID/Phone fields are empty
   - All fields are required
5. Fill in missing fields and complete checkout
6. Visit `/profile` and verify you can update information
