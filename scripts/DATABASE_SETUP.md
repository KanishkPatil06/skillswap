# Database Setup Instructions

Follow these steps to set up your Supabase database for the SkillSwap application.

## Prerequisites

- Supabase project created
- Supabase credentials in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 1: Run Main Schema

1. Open your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New query**
5. Open the file `scripts/01_init_schema.sql` in your code editor
6. Copy the entire contents
7. Paste into the Supabase SQL Editor
8. Click **Run** (or press Ctrl+Enter)

**Expected Result:** You should see a success message. This creates:
- 6 tables (profiles, skills, user_skills, connections, help_requests, chat_messages)
- Indexes for performance
- RLS policies for security
- 38 pre-populated skills

## Step 2: Create Profile Auto-Creation Trigger

1. In Supabase SQL Editor, click **New query**
2. Open the file `scripts/02_profile_trigger.sql` in your code editor
3. Copy the entire contents
4. Paste into the Supabase SQL Editor
5. Click **Run**

**Expected Result:** Success message. This creates a trigger that automatically creates a profile entry whenever a new user signs up.

## Step 3: Verify Setup

### Check Tables

1. In Supabase Dashboard, go to **Table Editor** (left sidebar)
2. You should see these tables:
   - profiles
   - skills
   - user_skills
   - connections
   - help_requests
   - chat_messages

### Check Skills

1. Click on the **skills** table
2. You should see 38 rows with various technical and non-technical skills

### Check Trigger

1. Go to **Database** → **Functions** (left sidebar)
2. You should see `handle_new_user` function
3. Go to **Database** → **Triggers**
4. You should see `on_auth_user_created` trigger on `auth.users` table

## Step 4: Test the Integration

1. Make sure your dev server is running: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click **Get Started**
4. Sign up with a new email and password
5. You should be redirected to the dashboard
6. Go back to Supabase Dashboard → Table Editor → **profiles**
7. You should see a new profile entry for your user!

## Troubleshooting

### "relation does not exist" error
- Make sure you ran `01_init_schema.sql` successfully
- Check that all tables were created in the Table Editor

### Profile not created automatically
- Verify the trigger exists in Database → Triggers
- Check Database → Functions for `handle_new_user`
- Try signing up with a different email

### RLS policy errors
- Make sure RLS is enabled on all tables
- Check that policies were created in Table Editor → [table] → Policies

### Can't see data in dashboard
- Check browser console for errors
- Verify Supabase credentials in `.env.local`
- Make sure you're logged in

## Next Steps

Once the database is set up:
- ✅ User profiles are automatically created on signup
- ✅ Dashboard displays user stats
- ✅ Users can update their profile
- ✅ Users can add/manage skills
- ✅ Discover page shows other users
- ✅ All data is secured with RLS policies

You're ready to start using SkillSwap! 🎉
