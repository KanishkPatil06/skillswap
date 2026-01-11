# Deployment Guide - SkillSwap

This guide will help you deploy your SkillSwap application to production.

## Prerequisites

Before deploying, ensure you have:
- ✅ Supabase database set up and configured
- ✅ All SQL scripts run (`01_init_schema.sql`, `02_profile_trigger.sql`, `03_fix_existing_users.sql`)
- ✅ Environment variables ready (`.env.local`)
- ✅ Application tested locally

---

## Option 1: Vercel (Recommended) ⭐

Vercel is the easiest and fastest way to deploy Next.js applications.

### Step 1: Prepare Your Project

1. **Create a GitHub repository** (if you haven't already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/skillswap.git
   git push -u origin main
   ```

2. **Ensure your `.gitignore` includes**:
   ```
   .env.local
   .env*.local
   node_modules/
   .next/
   ```

### Step 2: Deploy to Vercel

1. **Go to [Vercel](https://vercel.com)**
2. Click **"Add New Project"**
3. **Import your GitHub repository**
4. Vercel will auto-detect Next.js settings
5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
6. Click **"Deploy"**

### Step 3: Configure Supabase for Production

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Update:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: Add `https://your-app.vercel.app/**`
3. Update **Email Templates** redirect URLs to your production domain

### Step 4: Test Your Deployment

1. Visit your Vercel URL (e.g., `https://skillswap.vercel.app`)
2. Test signup/login
3. Test creating help requests
4. Verify all features work

---

## Option 2: Netlify

### Step 1: Prepare Your Project

Same as Vercel - push to GitHub.

### Step 2: Deploy to Netlify

1. **Go to [Netlify](https://netlify.com)**
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub and select your repository
4. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. **Add Environment Variables** (same as Vercel)
6. Click **"Deploy"**

### Step 3: Configure Supabase

Same as Vercel - update URLs to your Netlify domain.

---

## Option 3: Self-Hosting (VPS/Cloud)

If you want full control, you can deploy to a VPS (DigitalOcean, AWS, etc.).

### Requirements

- Node.js 18+ installed
- PM2 or similar process manager
- Nginx (for reverse proxy)

### Deployment Steps

1. **Build your application**:
   ```bash
   npm run build
   ```

2. **Start with PM2**:
   ```bash
   npm install -g pm2
   pm2 start npm --name "skillswap" -- start
   pm2 save
   pm2 startup
   ```

3. **Configure Nginx** (example):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Set up SSL with Let's Encrypt**:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Environment Variables Checklist

Make sure these are set in your deployment platform:

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Post-Deployment Checklist

After deploying:

- [ ] Test user signup and login
- [ ] Test profile creation (automatic trigger)
- [ ] Test creating help requests
- [ ] Test dashboard functionality
- [ ] Test discover page
- [ ] Verify email password reset works
- [ ] Check all pages load correctly
- [ ] Test on mobile devices
- [ ] Set up custom domain (optional)
- [ ] Enable analytics (optional)

---

## Custom Domain Setup

### Vercel

1. Go to your project → **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update Supabase URLs to your custom domain

### Netlify

1. Go to **Domain settings**
2. Add custom domain
3. Follow DNS configuration instructions
4. Update Supabase URLs

---

## Troubleshooting

### Build Fails

- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### Authentication Not Working

- Verify Supabase environment variables are correct
- Check Supabase URL Configuration matches your deployment URL
- Ensure redirect URLs include `/**` wildcard

### Database Errors

- Verify all SQL scripts were run in Supabase
- Check RLS policies are enabled
- Verify profile trigger is working

### 404 Errors

- Ensure build completed successfully
- Check Next.js routing configuration
- Verify all pages are in the correct directories

---

## Recommended: Vercel Deployment

For the easiest and fastest deployment, I recommend **Vercel**:

✅ **Pros:**
- Zero configuration for Next.js
- Automatic HTTPS
- Global CDN
- Automatic deployments on git push
- Free tier available
- Excellent performance

**Quick Start:**
1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

Your app will be live in minutes! 🚀

---

## Need Help?

If you encounter any issues during deployment:
1. Check the deployment platform's logs
2. Verify environment variables
3. Test locally first with production environment variables
4. Check Supabase dashboard for API errors

Good luck with your deployment! 🎉
