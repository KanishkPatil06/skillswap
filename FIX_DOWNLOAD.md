# Fix File Download Issue - Quick Check

## The Problem
Files appear in chat ✅ but download fails with "file not available" ❌

## Most Likely Causes

### 1. Storage Bucket Doesn't Exist
**Check:** Supabase Dashboard → Storage
- Look for a bucket named `chat-files`
- If it doesn't exist, **create it**:
  - Click "New bucket"
  - Name: `chat-files`
  - **Public: NO** ❌ (leave unchecked)
  - Click "Create bucket"

### 2. Storage Policies Not Applied
**Did you run the second script?** `13_storage_policies.sql`

If **NO**:
1. Open Supabase SQL Editor
2. Copy content from `13_storage_policies.sql`
3. Paste and run it

If **YES**, verify it worked:
- Go to Supabase → Storage → chat-files → Policies
- You should see 2 policies:
  - `Users can upload files to their connections`
  - `Users can view files in their connections`

### 3. Check Browser Console
When you click download:
1. Open browser console (F12)
2. Click the download button
3. Look for errors like:
   - "404 Not Found" → Bucket doesn't exist
   - "403 Forbidden" → Policies not set
   - "Object not found" → File path issue

**Copy any error messages you see!**

---

## Quick Test

After creating the bucket and running the storage policies script:
1. Refresh your chat page
2. Upload a NEW file
3. Try downloading it
4. Should work! ✅
