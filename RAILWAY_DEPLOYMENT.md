# Railway Deployment Guide - MailGen

This guide explains how to deploy the frontend and backend as separate services on Railway.

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │    Backend      │
│   (React +      │  ───>   │   (Node.js +    │
│    Vite)        │         │    Express)     │
│   Port: 3000    │         │   Port: 3333    │
└─────────────────┘         └─────────────────┘
```

---

## Step 1: Create Backend Service

### 1.1 Create New Service
1. Go to Railway Dashboard: https://railway.app
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select **`lucaszengool/mailgen`**
4. Railway will create the first service

### 1.2 Configure Backend Service

#### Source Settings:
- **Root Directory**: Leave empty (uses project root)
- **Branch**: `main`

#### Build Settings:
- **Builder**: Nixpacks (default)
- **Build Command**: Leave empty (auto-detected)
- **Watch Paths**: Leave empty

#### Deploy Settings:
- **Start Command**: `node server/index.js`

#### Environment Variables:
Add these in the **Variables** tab:

```bash
# Server Configuration
PORT=3333
NODE_ENV=production

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434

# Redis Configuration (get from Railway Redis addon)
REDIS_URL=redis://default:password@host:port

# SMTP Configuration (for email sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SENDER_NAME=MailGen
COMPANY_NAME=MailGen

# Optional: ScrapingDog API (for web scraping)
SCRAPINGDOG_API_KEY=your-api-key-here
```

#### Networking:
- **Public Networking**: Enable
- **Generate Domain**: Click to get a URL (e.g., `your-backend.railway.app`)
- Copy this URL - you'll need it for the frontend!

---

## Step 2: Add Redis Database

### 2.1 Add Redis Service
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add Redis"**
3. Railway will provision a Redis instance

### 2.2 Link Redis to Backend
1. Redis will auto-generate a `REDIS_URL` variable
2. Go to Backend service → **Variables** tab
3. Click **"+ New Variable"** → **"Add Reference"**
4. Select Redis → `REDIS_URL`

---

## Step 3: Create Frontend Service

### 3.1 Add Frontend Service
1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"** → **`lucaszengool/mailgen`**
3. This creates a second service

### 3.2 Configure Frontend Service

#### Source Settings:
- **Root Directory**: `client`
- **Branch**: `main`

#### Build Settings:
- **Builder**: Nixpacks (default)
- **Build Command**: `npm install && npm run build`
- **Watch Paths**: `client/**`

#### Deploy Settings:
- **Start Command**: 
```bash
npm run preview -- --host 0.0.0.0 --port $PORT
```

#### Environment Variables:
Add these in the **Variables** tab:

```bash
# Backend API URL (use the URL from Step 1.2)
VITE_API_URL=https://your-backend.railway.app

# OR if Railway provides service discovery
VITE_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
```

#### Networking:
- **Public Networking**: Enable
- **Generate Domain**: Click to get a URL (e.g., `your-app.railway.app`)
- This is your public application URL!

---

## Step 4: Update CORS Configuration

Your backend needs to allow requests from the frontend domain.

### 4.1 Add Frontend URL to Backend Variables
1. Go to **Backend service** → **Variables** tab
2. Add new variable:
```bash
FRONTEND_URL=https://your-frontend.railway.app
```

---

## Step 5: Verify Deployment

### Backend Health Check:
```bash
curl https://your-backend.railway.app/health
# Should return: {"status":"ok"}
```

### Frontend Access:
Open `https://your-frontend.railway.app` in your browser

---

## Service Configuration Summary

### Backend Service
| Setting | Value |
|---------|-------|
| **Root Directory** | (empty - project root) |
| **Start Command** | `node server/index.js` |
| **Port** | 3333 (from $PORT env) |
| **Domain** | your-backend.railway.app |

### Frontend Service
| Setting | Value |
|---------|-------|
| **Root Directory** | `client` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run preview -- --host 0.0.0.0 --port $PORT` |
| **Port** | Auto-assigned by Railway |
| **Domain** | your-frontend.railway.app |

---

## Troubleshooting

### Build Failures

**Backend build fails:**
```bash
# Check logs in Railway dashboard
# Common issue: Missing dependencies
# Solution: Ensure package.json is in root directory
```

**Frontend build fails:**
```bash
# Common issue: Missing client/package.json
# Solution: Verify "Root Directory" is set to "client"
```

### Connection Issues

**Frontend can't connect to backend:**
1. Check `VITE_API_URL` is set correctly
2. Verify CORS is configured in backend
3. Check both services are deployed and running

**Backend can't connect to Redis:**
1. Verify Redis service is running
2. Check `REDIS_URL` variable is set
3. Ensure Redis and Backend are in same project

---

## Environment Variables Reference

### Backend Required Variables:
- `PORT` - Server port (auto-provided by Railway)
- `REDIS_URL` - Redis connection string (from Redis service)
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - Email address for sending
- `SMTP_PASS` - Email password/app password

### Frontend Required Variables:
- `VITE_API_URL` - Backend API URL

### Optional Variables:
- `OLLAMA_BASE_URL` - For AI features
- `SCRAPINGDOG_API_KEY` - For web scraping
- `NODE_ENV` - Environment (production/development)

---

## Automatic Deployments

Railway automatically deploys when you push to GitHub:

1. Make changes to your code
2. Commit and push to `main` branch:
```bash
git add .
git commit -m "Update feature"
git push origin main
```
3. Railway automatically detects changes and redeploys
4. Frontend changes trigger frontend deploy only
5. Backend changes trigger backend deploy only

---

## Cost Estimation

Railway Pro Plan includes:
- **$5/month** base fee
- **$0.000231/GB-hour** for memory
- **$0.000463/vCPU-hour** for CPU

Estimated monthly cost for this setup:
- Backend (512MB, 0.5 vCPU): ~$8-12/month
- Frontend (512MB, 0.5 vCPU): ~$8-12/month  
- Redis (256MB): ~$4-6/month
- **Total**: ~$20-30/month

---

## Support

For Railway-specific issues:
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

For application issues:
- GitHub Issues: https://github.com/lucaszengool/mailgen/issues
