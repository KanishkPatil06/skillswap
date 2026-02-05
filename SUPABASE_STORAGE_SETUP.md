# Supabase Storage Configuration - Step-by-Step Guide

## What We're Doing
Setting up the storage bucket and RLS policies so your files will be visible on the website.

---

## Step 1: Verify Storage Bucket

1. **Open your Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Sign in if needed
   - Select your SkillSwap project

2. **Navigate to Storage**
   - In the left sidebar, click **"Storage"**
   - Look for a bucket named **`chat-files`**

3. **If the bucket EXISTS:**
   - Click on it to view details
   - Make sure **"Public bucket"** is **OFF/UNCHECKED** ❌
   - If it's public, you'll need to change it to private

4. **If the bucket DOESN'T EXIST:**
   - Click **"New bucket"** button
   - Bucket name: `chat-files`
   - **Important:** Leave **"Public bucket"** UNCHECKED ❌
   - Click **"Create bucket"**

---

## Step 2: Apply RLS Policies

1. **Navigate to SQL Editor**
   - In the left sidebar, click **"SQL Editor"**

2. **Copy the SQL Script**
   - You already have the file `13_storage_policies.sql` open
   - Select ALL the content (Ctrl+A)
   - Copy it (Ctrl+C)

3. **Run the Script**
   - In the SQL Editor, click **"New query"**
   - Paste the SQL script (Ctrl+V)
   - Click **"Run"** button (or press F5)

4. **Verify Success**
   - You should see a success message
   - The output should show 2 policies created:
     - `Users can upload files to their connections`
     - `Users can view files in their connections`

---

## Step 3: Test File Sharing

1. **Refresh your website** (if needed)
   - Your dev server is already running at http://localhost:3000

2. **Navigate to a chat**
   - Go to Connections page
   - Click on any active connection

3. **Try uploading a file**
   - Click the file upload button (📎 icon)
   - Select any file
   - Upload it

4. **Verify it's visible**
   - The file should appear in the chat
   - You should be able to click download
   - Old files should also now be visible!

---

## Troubleshooting

### Files still not showing?
1. Check browser console (F12 → Console tab) for errors
2. Verify the bucket name is exactly `chat-files`
3. Make sure RLS policies were applied (check Supabase → Storage → Policies)

### Can't upload files?
- Check that the RLS policies allow uploads
- Verify your connection status is "accepted"

### Need to check existing files?
- Go to Supabase Dashboard → Storage → chat-files
- You should see folders named with connection IDs
- Files are organized as: `connectionId/timestamp.extension`

---

## What Changed in the Code

✅ **Before**: Using public URLs (blocked by RLS)
```typescript
getPublicUrl() // Doesn't work with RLS policies
```

✅ **After**: Using signed URLs (works with RLS)
```typescript
createSignedUrl(path, 3600) // Generates authenticated URL valid for 1 hour
```

The code now:
- Stores only file **paths** in the database
- Generates fresh **signed URLs** when displaying messages
- Handles both old and new messages automatically
