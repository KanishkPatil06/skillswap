# File Sharing Storage Setup Instructions

## Issue
Files are visible in the Supabase database but not displaying on the website.

## Root Cause
The code was using public URLs with RLS policies enabled, which blocks access. Files need signed URLs for authenticated access.

## ✅ Code Fix Applied
Updated `components/chat/chat-content.tsx` to:
- Store file paths (not URLs) in the database
- Generate signed URLs dynamically when displaying messages
- Handle both old and new message formats

## Required Supabase Configuration

### 1. Create the Storage Bucket (if not exists)

Go to **Supabase Dashboard → Storage** and verify:
- Bucket name: `chat-files`
- Public bucket: **❌ NO** (leave unchecked - we use RLS policies)

If the bucket doesn't exist, create it with these settings.

### 2. Apply RLS Policies

Run the SQL script `scripts/13_storage_policies.sql` in **Supabase SQL Editor**:

```sql
-- This script creates two policies:
-- 1. Users can upload files to their connections
-- 2. Users can view/download files from their connections
```

The policies ensure users can only access files from their accepted connections.

### 3. Verify Policy Creation

After running the script, check the output. You should see two policies:
- `Users can upload files to their connections`
- `Users can view files in their connections`

## Testing

1. Upload a new file in the chat
2. The file should now be visible and downloadable
3. Old files should also work (the code regenerates signed URLs for them)

## Technical Details

**Before**: `getPublicUrl()` → Returns public URL → Blocked by RLS
**After**: `createSignedUrl(path, 3600)` → Returns temporary authenticated URL → ✅ Works with RLS

Signed URLs are valid for 1 hour and include authentication tokens.
