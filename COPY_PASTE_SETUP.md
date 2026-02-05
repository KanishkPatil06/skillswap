# 🚀 Quick Setup - Copy & Paste These Commands

I've opened your Supabase dashboard and local app. Follow these steps:

---

## ✅ STEP 1: Database Migration (2 minutes)

**In your Supabase Dashboard** (just opened in browser):

1. Click **SQL Editor** in left sidebar
2. Click **+ New query**
3. Copy and paste this ENTIRE SQL block:

```sql
-- ============================================================================
-- FILE AND NOTES SHARING MIGRATION
-- ============================================================================
-- This script adds file and notes sharing functionality to the chat system
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Add new columns to chat_messages table for file and notes support
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'note'));

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS file_url TEXT;

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS file_name TEXT;

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS file_size BIGINT;

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS file_type TEXT;

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS note_title TEXT;

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS note_content TEXT;

-- Add index for message_type for efficient querying
CREATE INDEX IF NOT EXISTS idx_chat_messages_message_type 
ON public.chat_messages(message_type);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify new columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
AND table_schema = 'public'
AND column_name IN ('message_type', 'file_url', 'file_name', 'file_size', 'file_type', 'note_title', 'note_content')
ORDER BY column_name;

-- Verify index was created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'chat_messages'
AND indexname = 'idx_chat_messages_message_type';
```

4. Click **Run** (or Ctrl+Enter)
5. You should see **7 rows** returned showing the new columns ✅

---

## ✅ STEP 2: Create Storage Bucket (1 minute)

**Still in Supabase Dashboard**:

1. Click **Storage** in left sidebar
2. Click **Create a new bucket** 
3. Fill in:
   - Name: `chat-files`
   - Public bucket: ✅ **CHECK THIS BOX**
   - File size limit: `10485760`
4. Click **Create bucket** ✅

---

## ✅ STEP 3: Storage Policy 1 - Upload (30 seconds)

1. Click on `chat-files` bucket
2. Click **Policies** tab
3. Click **New policy**
4. Choose **For full customization** → **Create policy**
5. Fill in:
   - Policy name: `Users can upload files to their connections`
   - Allowed operation: **INSERT** ✅
   - Policy definition: Paste this 👇

```sql
EXISTS (
  SELECT 1 FROM public.connections c
  WHERE (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
  AND c.status = 'accepted'
)
```

6. Click **Review** → **Save policy** ✅

---

## ✅ STEP 4: Storage Policy 2 - Download (30 seconds)

1. Click **New policy** again
2. Choose **For full customization** → **Create policy**
3. Fill in:
   - Policy name: `Users can view files in their connections`
   - Allowed operation: **SELECT** ✅
   - Policy definition: Paste this 👇

```sql
EXISTS (
  SELECT 1 FROM public.connections c
  WHERE (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
  AND c.status = 'accepted'
)
```

4. Click **Review** → **Save policy** ✅

---

## ✅ STEP 5: Test It! (1 minute)

**In your local app** (http://localhost:3000/connections - just opened):

1. Open any chat connection
2. Look for **two new icons** next to the message input:
   - 📎 **Paperclip** (file upload)
   - 📝 **Sticky note** (create note)

3. **Test File Upload**:
   - Click the paperclip icon
   - Choose any file (image, PDF, etc.)
   - Should upload and show in chat with a Download button

4. **Test Note**:
   - Click the sticky note icon
   - Title: "Test"
   - Content: "My first note!"
   - Click Save Note
   - Should appear in chat

---

## ✅ Success!

If you see the file and note in your chat, you're done! 🎉

The feature is now fully working.

---

**Having issues?** Check the console (F12) for any error messages and let me know!
