# Debug File Visibility Issue - Quick Check

## Step 1: Open Browser Console
1. Open your chat page where files should appear
2. Press **F12** or **Right-click → Inspect**
3. Click the **Console** tab

## Step 2: Look for Debug Messages
You should see messages like:
- 🔍 Processing file messages: [...]
- 📁 Processing file message: ...
- 🔑 Generating signed URL for: ...
- ✅ Signed URL generated successfully

## Step 3: Check for Errors

### A) If you see ❌ Error messages:
**Copy the full error** and share it with me.

Common errors:
- **"Object not found"** → File doesn't exist in storage bucket
- **"Bucket not found"** → `chat-files` bucket doesn't exist
- **"Policy violation"** → RLS policies not set up correctly

### B) If you DON'T see any debug messages:
The page might be cached. Try:
1. Hard refresh: **Ctrl + Shift + R**
2. If that doesn't work, restart the dev server:
   - Stop: **Ctrl + C** in the terminal
   - Start: `npm run dev`

## Step 4: Check Database
Look at what's stored in the database for file_url:

**Option 1: Should be a PATH (new uploads)**
```
connectionId/timestamp.ext
Example: abc123-def456/1738752340000.pdf
```

**Option 2: Might be a URL (old uploads)**
```
https://...supabase.co/storage/v1/object/public/chat-files/...
```

Both formats should work with the updated code.

## Step 5: What to Share
Send me:
1. **Console output** (screenshot or copy/paste)
2. **Any error messages** you see
3. **Sample file_url** from database (just one example)

This will help me identify exactly what's wrong!
