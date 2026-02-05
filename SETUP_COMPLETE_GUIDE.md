# 🚀 Complete Setup Instructions

Follow these steps carefully to enable file and notes sharing:

---

## ✅ Step 1: Run Database Migration

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Sign in to your account
   - Select your project: `ipnucrikywqwklptaszs`

2. **Navigate to SQL Editor**
   - In the left sidebar, click the **SQL Editor** icon (looks like `</>`)

3. **Run the Migration**
   - Click **+ New query**
   - Copy the ENTIRE content from the file below 👇
   
   **File**: `c:\skill-swap-web-application\scripts\12_add_file_notes_sharing.sql`

   ```sql
   -- Copy everything from this file --
   ```

4. **Execute**
   - Click **Run** (or press Ctrl+Enter)
   - Wait for "Success" message
   - You should see: "Query returned successfully"

---

## ✅ Step 2: Create Storage Bucket

1. **Navigate to Storage**
   - In the left sidebar, click **Storage** icon (looks like a folder/box)

2. **Create New Bucket**
   - Click **Create a new bucket** button (green button, top right)

3. **Configure Bucket Settings**
   Fill in these exact values:
   
   | Setting | Value |
   |---------|-------|
   | **Name** | `chat-files` |
   | **Public bucket** | ✅ **CHECKED** (important!) |
   | **File size limit** | `10485760` |
   | **Allowed MIME types** | Leave empty (allow all) |

4. **Create**
   - Click **Create bucket**
   - You should see `chat-files` appear in your buckets list

---

## ✅ Step 3: Set Storage Policies

1. **Open Bucket Policies**
   - Click on `chat-files` bucket
   - Click the **Policies** tab

2. **Create Policy 1 - Upload Permission**
   - Click **New policy** button
   - Choose **For full customization** → **Create policy**
   
   Configure:
   ```
   Policy name: Users can upload files to their connections
   Allowed operation: INSERT ✅
   
   Policy definition (paste in the code editor):
   ```sql
   (
     EXISTS (
       SELECT 1 FROM public.connections c
       WHERE (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
       AND c.status = 'accepted'
     )
   )
   ```
   
   - Click **Review** → **Save policy**

3. **Create Policy 2 - Download Permission**
   - Click **New policy** again
   - Choose **For full customization** → **Create policy**
   
   Configure:
   ```
   Policy name: Users can view files in their connections
   Allowed operation: SELECT ✅
   
   Policy definition (paste in the code editor):
   ```sql
   (
     EXISTS (
       SELECT 1 FROM public.connections c
       WHERE (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
       AND c.status = 'accepted'
     )
   )
   ```
   
   - Click **Review** → **Save policy**

4. **Verify Policies**
   - You should now see 2 policies listed:
     - ✅ Users can upload files to their connections (INSERT)
     - ✅ Users can view files in their connections (SELECT)

---

## ✅ Step 4: Test the Feature

1. **Open Your App**
   - Go to: http://localhost:3000
   - Navigate to **Connections**
   - Open any active chat

2. **Test File Upload** 📎
   - Look for the **paperclip icon** next to the message input
   - Click it and select a file (try an image or PDF)
   - The file should upload and appear in the chat
   - Click the **Download** button to verify it works

3. **Test Note Creation** 📝
   - Look for the **sticky note icon** next to the paperclip
   - Click it to open the note dialog
   - Enter a title: "Test Note"
   - Enter content: "This is my first note!"
   - Click **Save Note**
   - The note should appear in the chat

4. **Test Real-time Sync**
   - Open the same chat on a different device/browser
   - Send a file or note from one device
   - Verify it appears immediately on the other device

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ Two new icons appear in the chat input area (📎 and 📝)
✅ Files upload without errors
✅ Files show with correct icon and size
✅ Download button works
✅ Notes display with title and content
✅ Long notes have "Show more/less" buttons
✅ All messages sync in real-time
✅ Old text messages still work perfectly

---

## ❌ Troubleshooting

### "Error uploading file"
- Check that `chat-files` bucket exists
- Verify bucket is **public** (checkbox was checked)
- Confirm both storage policies are created

### "Failed to send message"
- Check database migration ran successfully
- Go to Supabase → Database → Tables → `chat_messages`
- Verify these columns exist: `message_type`, `file_url`, `file_name`, etc.

### Files won't download
- Ensure bucket is **public**
- Check SELECT policy is active

### Need to verify migration ran?
Run this in SQL Editor:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
AND column_name IN ('message_type', 'file_url', 'file_name', 'file_size', 'file_type', 'note_title', 'note_content');
```

Should return 7 rows.

---

## 📞 Next Steps After Setup

Once all 4 steps are complete:
1. Refresh your app (http://localhost:3000)
2. Open a chat connection
3. Try uploading a file and creating a note
4. Celebrate! 🎉

---

**Questions?** Review [QUICK_SETUP.md](file:///c:/skill-swap-web-application/QUICK_SETUP.md) or [walkthrough.md](file:///C:/Users/prajw/.gemini/antigravity/brain/71bbf856-439a-49b1-8e56-8446274fd589/walkthrough.md) for more details.
