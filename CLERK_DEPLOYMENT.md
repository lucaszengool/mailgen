# Clerk Authentication Deployment Guide

## Overview
Clerk authentication has been successfully integrated into MailGen. This guide will help you deploy it to Railway.

## What Was Done

### Frontend Changes
1. ✅ Installed `@clerk/clerk-react` and `react-router-dom`
2. ✅ Added ClerkProvider to `client/src/main.jsx` wrapping the entire app
3. ✅ Created dedicated sign-in page at `/sign-in` (`client/src/pages/SignIn.jsx`)
4. ✅ Created dedicated sign-up page at `/sign-up` (`client/src/pages/SignUp.jsx`)
5. ✅ Updated main page navigation buttons to redirect to sign-in/sign-up pages
6. ✅ Styled auth pages to match the grey/black/green theme

### Backend Changes
1. ✅ Installed `@clerk/express`
2. ✅ Added Clerk middleware to Express server (`server/index.js`)
3. ✅ Configured Clerk to work with your existing API routes

### Environment Variables
- ✅ Created `client/.env` with `VITE_CLERK_PUBLISHABLE_KEY`
- ✅ Updated `.env` with Clerk keys (already had placeholder values)

## Railway Deployment Steps

### 1. Update Clerk Environment Variables in Railway

You need to add these environment variables to your Railway project:

**For the Client (Frontend):**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_d2lzZS1kaW5nby03NC5jbGVyay5hY2NvdW50cy5kZXYk
```

**For the Server (Backend):**
```
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
```

⚠️ **IMPORTANT:** Replace `sk_test_YOUR_SECRET_KEY_HERE` with your actual Clerk Secret Key from the Clerk Dashboard.

### 2. Get Your Clerk Secret Key

1. Go to https://dashboard.clerk.com
2. Select your application (wise-dingo-74)
3. Navigate to **API Keys** in the left sidebar
4. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

### 3. Add Variables to Railway

#### Option A: Via Railway Dashboard
1. Go to your Railway project: https://railway.app/project/[your-project-id]
2. Click on your service
3. Go to the **Variables** tab
4. Add the two environment variables above
5. Click **Deploy** to redeploy with the new variables

#### Option B: Via Railway CLI
```bash
railway variables set VITE_CLERK_PUBLISHABLE_KEY=pk_test_d2lzZS1kaW5nby03NC5jbGVyay5hY2NvdW50cy5kZXYk
railway variables set CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
```

### 4. Configure Clerk Dashboard

After deploying to Railway, you need to update your Clerk application settings:

1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to **Domains** in the left sidebar
4. Add your Railway domain (e.g., `mailgen.railway.app`)
5. Navigate to **Paths** and set:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/`
   - After sign-up URL: `/`

### 5. Test Your Deployment

After deployment:
1. Visit your Railway URL
2. Click **JOIN NOW** or **SIGN IN** buttons
3. Complete the sign-up/sign-in flow
4. Verify you're redirected back to the main dashboard

## Local Development

To run locally:

```bash
# Make sure .env files are configured
# Start the development server
npm run dev
```

Visit `http://localhost:3000` and test the authentication flow.

## Protecting Routes (Optional)

If you want to protect certain API routes so only authenticated users can access them, add the `requireAuth` middleware:

```javascript
// In server/index.js or specific route files
const { requireAuth } = require('@clerk/express');

// Protect a specific route
app.get('/api/protected-route', requireAuth(), (req, res) => {
  // Only authenticated users can access this
  res.json({ userId: req.auth.userId });
});
```

## Troubleshooting

### Issue: "Missing Clerk Publishable Key" error
- Make sure `VITE_CLERK_PUBLISHABLE_KEY` is set in Railway variables
- Railway needs to rebuild the client when you add Vite environment variables

### Issue: Sign-in/sign-up pages not loading
- Check that the routes are correctly set up in `App.jsx`
- Verify ClerkProvider is wrapping the entire app in `main.jsx`

### Issue: Authentication not persisting
- Make sure your Clerk domain is correctly configured in the Clerk Dashboard
- Check browser console for CORS or cookie errors

## Support

For more information:
- Clerk Documentation: https://clerk.com/docs
- Railway Documentation: https://docs.railway.app
- Clerk + React Guide: https://clerk.com/docs/quickstarts/react

## Summary

✅ Clerk authentication is fully integrated
✅ SIGN IN and JOIN NOW buttons redirect to auth pages
✅ Backend middleware is configured
✅ Ready to deploy to Railway

**Next Step:** Add your Clerk Secret Key to Railway environment variables and deploy!
