# Create Storage Bucket - Quick Guide

## Error: "Bucket not found"

The `chat-files` bucket needs to be created manually in Supabase.

## Steps to Create Bucket (30 seconds):

1. **Open Supabase Dashboard**
   - Go to: https://ipnucrikywqwklptaszs.supabase.co
   - Sign in

2. **Navigate to Storage**
   - Click **Storage** in the left sidebar (folder icon)

3. **Create New Bucket**
   - Click **"Create a new bucket"** button (green button, top right)

4. **Fill in Settings**:
   ```
   Name: chat-files
   Public bucket: ✅ CHECK THIS BOX (IMPORTANT!)
   File size limit: 10485760
   Allowed MIME types: (leave empty)
   ```

5. **Click "Create bucket"**

## Then Continue:

After creating the bucket:
1. Run the storage policies SQL (from `13_storage_policies.sql`)
2. Refresh your app
3. Try uploading a file again

---

**Quick verification**: After creating, you should see `chat-files` listed in your Storage buckets with a 🌐 (public) icon.
