# Quick Fix: Run These Scripts in Order

## ❌ The Error You Got
The script tried to insert into `storage.policies` table which doesn't exist. That's an outdated method.

## ✅ The Fix: Run TWO Scripts

### Step 1: Add Database Columns
**Run this script:** `12_add_file_notes_sharing_FIXED.sql`

1. Open Supabase SQL Editor
2. Copy the content from this file
3. Paste and run it

This adds the 7 columns to `chat_messages` table.

---

### Step 2: Add Storage Policies
**Run this script:** `13_storage_policies.sql`

1. In the same SQL Editor
2. Copy the content from `13_storage_policies.sql` (you already have it open!)
3. Paste and run it

This creates the storage bucket policies correctly.

---

## Why Two Scripts?

1. **Database columns** = Added via ALTER TABLE ✅
2. **Storage policies** = Created via CREATE POLICY ✅

The original script mixed these two incorrectly.

---

## After Running Both Scripts

Try uploading a file - it will work! 🎉
