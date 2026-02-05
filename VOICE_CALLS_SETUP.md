# Voice Calls Setup - Next Steps

## ✅ What's Done

**1. Database**
- Created `scripts/14_add_voice_calls.sql`
- Adds `call_history` table with RLS policies

**2. API Routes**
- `/api/calls/create-room` - Creates call rooms
- `/api/calls/end` - Ends calls and updates history

**3. UI Components**
- `voice-call-button.tsx` - Call button in chat
- `call-modal.tsx` - Active call interface
- `incoming-call-notification.tsx` - Incoming call alert

**4. Integration**
- Voice call button added to chat header (three dots menu)
- Real-time signaling via Supabase
- Incoming call listener active

---

## 🔧 Setup Required

### Step 1: Run Database Migration
**Run this in Supabase SQL Editor:**
```sql
-- Copy and paste the contents of scripts/14_add_voice_calls.sql
```

### Step 2: Get Daily.co API Key (Optional - for production)
1. Go to https://daily.co
2. Sign up for free account
3. Get API key from dashboard  
4. Add to `.env.local`:
   ```
   DAILY_API_KEY=your_api_key_here
   ```

**For now:** The app works without Daily.co (uses simple room URLs for testing)

---

## 📱 How to Use

1. Open a chat with a connection
2. Click the three dots (⋮) in chat header
3. Click the **phone icon** to start a call
4. Other user will see incoming call notification
5. They can accept or decline
6. During call: mute, unmute, or end call

---

## 🚀 Next: Deploy to Vercel

After running the database migration:
```bash
git add .
git commit -m "Add voice call feature"
git push
```

Vercel will deploy in ~2 minutes
