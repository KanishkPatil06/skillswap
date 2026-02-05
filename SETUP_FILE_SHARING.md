# Setup Instructions for File and Notes Sharing

## Step 1: Run Database Migration

1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `scripts/12_add_file_notes_sharing.sql`
4. Run the query

This will add the necessary columns to your `chat_messages` table.

## Step 2: Create Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click **Create a new bucket**
3. Configure the bucket:
   - **Name**: `chat-files`
   - **Public bucket**: ✅ Check this (files need to be downloadable)
   - **File size limit**: 10485760 (10MB in bytes)
   - **Allowed MIME types**: Leave empty (allow all types) or configure as needed

4. Click **Create bucket**

## Step 3: Set Storage Policies

After creating the bucket, you need to set up RLS policies:

1. In Storage, click on the `chat-files` bucket
2. Go to **Policies** tab
3. Click **New Policy**

### Policy 1: Upload Files
- **Policy name**: Users can upload files to their connections
- **Allowed operation**: INSERT
- **Policy definition**:
```sql
(
  EXISTS (
    SELECT 1 FROM public.connections c
    WHERE (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
    AND c.status = 'accepted'
  )
)
```

### Policy 2: Select Files  
- **Policy name**: Users can view files in their connections
- **Allowed operation**: SELECT
- **Policy definition**:
```sql
(
  EXISTS (
    SELECT 1 FROM public.connections c
    WHERE (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
    AND c.status = 'accepted'
  )
)
```

## Step 4: Test the Feature

Once the setup is complete, test the following:

1. **Text Messages** - Verify existing chat still works
2. **File Upload** - Click paperclip icon, upload a file
3. **Note Creation** - Click note icon, create a note with title and content
4. **File Download** - Click download button on file messages
5. **Real-time Sync** - Open chat on two devices, verify files and notes sync

## Verification Checklist

- [ ] Database migration completed successfully
- [ ] Storage bucket `chat-files` created
- [ ] Storage policies configured
- [ ] Text messages still work
- [ ] Files can be uploaded
- [ ] Files can be downloaded
- [ ] Notes can be created
- [ ] Notes display correctly
- [ ] Real-time updates work for all message types
