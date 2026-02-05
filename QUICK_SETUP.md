# Quick Setup Guide - File & Notes Sharing

## 📋 What to Do Next

Follow these steps to enable file and notes sharing in your chat:

### 1. Database Setup (Required ⚠️)

Open **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- File: scripts/12_add_file_notes_sharing.sql
-- Copy and paste the entire contents of this file
```

This adds new columns to your `chat_messages` table.

### 2. Create Storage Bucket (Required ⚠️)

**Supabase Dashboard** → **Storage** → **Create Bucket**:

- **Name**: `chat-files`
- **Public**: ✅ YES (needed for downloads)
- **File size limit**: `10485760` (10MB)

### 3. Storage Policies (Required ⚠️)

**Storage** → `chat-files` → **Policies** → **New Policy**

**Policy 1 - Upload (INSERT)**:
```sql
EXISTS (
  SELECT 1 FROM public.connections c
  WHERE (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
  AND c.status = 'accepted'
)
```

**Policy 2 - Download (SELECT)**:
```sql
EXISTS (
  SELECT 1 FROM public.connections c
  WHERE (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
  AND c.status = 'accepted'
)
```

### 4. Test It Out! 🎉

Open your chat and you'll see two new icons:

- **📎 Paperclip** - Upload files (images, PDFs, documents, etc.)
- **📝 Note icon** - Create formatted notes

---

## ⚡ Quick Reference

### File Uploads
- Max size: 10MB
- Automatic file type detection
- Download with one click
- Real-time sync

### Notes
- Title + Content format
- Auto-collapse long notes (150+ chars)
- Styled background boxes
- Real-time sync

### Existing Features
✅ All chat features work unchanged:
- Text messages
- Read receipts (✓✓)
- Typing indicators
- Real-time delivery

---

## 📚 Full Documentation

- [SETUP_FILE_SHARING.md](file:///c:/skill-swap-web-application/SETUP_FILE_SHARING.md) - Detailed setup instructions
- [walkthrough.md](file:///C:/Users/prajw/.gemini/antigravity/brain/71bbf856-439a-49b1-8e56-8446274fd589/walkthrough.md) - Complete implementation details

---

## ❓ Troubleshooting

**Files won't upload?**
- Check storage bucket is created
- Verify RLS policies are set
- Confirm bucket is public

**Notes not appearing?**
- Check database migration ran successfully
- Verify `message_type` column exists

**Need help?**
- Check browser console for errors
- Verify Supabase connection
- Review setup steps above
