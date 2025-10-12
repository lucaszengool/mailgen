# SearXNG Railway Deployment Guide

This guide will help you deploy SearXNG as a separate service on Railway to work with your Ollama + SearXNG backend integration.

---

## 🎯 What This Does

Your backend uses **Ollama + SearXNG** integration:
- **Ollama** (Modal): AI-powered analysis and strategy generation
- **SearXNG** (Railway): Real web search for finding prospects and emails

---

## 📋 Step 1: Push SearXNG Files to GitHub

First, commit and push the SearXNG configuration files:

```bash
cd /Users/James/Desktop/agent

git add Dockerfile.searxng searxng-settings.yml railway.searxng.json
git commit -m "Add SearXNG configuration for Railway deployment"
git push origin main
```

---

## 🚀 Step 2: Create SearXNG Service on Railway

### 2.1 Add New Service

1. Go to **Railway Dashboard** → Your Project
2. Click **"+ New"**
3. Select **"GitHub Repo"** → **`lucaszengool/mailgen`**
4. This creates a new service (will be your 3rd service alongside backend and frontend)

### 2.2 Configure SearXNG Service Settings

Go to the new service → **Settings** tab:

#### Service Name
```
SearXNG
```

#### Root Directory
```
(leave empty - use project root)
```

#### Build Settings
- **Builder**: Dockerfile
- **Dockerfile Path**: `Dockerfile.searxng`

#### Deploy Settings
- **Custom Start Command**:
```bash
/usr/local/searxng/dockerfiles/docker-entrypoint.sh
```

#### Environment Variables

Go to **Variables** tab and add:

```bash
# Generate a random secret key (run this in your terminal):
# openssl rand -hex 32

SEARXNG_SECRET=<paste_your_random_secret_here>
SEARXNG_BASE_URL=${{RAILWAY_PUBLIC_DOMAIN}}
BIND_ADDRESS=0.0.0.0:8080
INSTANCE_NAME=Railway SearXNG
```

#### Networking

1. **Public Networking**: Enable
2. Click **"Generate Domain"**
3. **Copy the domain URL** (e.g., `searxng-production.up.railway.app`)

---

## 🔧 Step 3: Update Backend Service

Now connect your backend to the SearXNG service:

### 3.1 Add Environment Variable

Go to **Backend (honest-hope)** → **Variables** tab:

```bash
SEARXNG_URL=https://<your-searxng-domain>.up.railway.app
```

**Example:**
```bash
SEARXNG_URL=https://searxng-production.up.railway.app
```

---

## ✅ Step 4: Verify Everything Works

### 4.1 Check SearXNG is Running

Open in browser:
```
https://your-searxng-domain.up.railway.app
```

You should see the SearXNG search interface.

### 4.2 Test JSON API

```bash
curl "https://your-searxng-domain.up.railway.app/search?q=test&format=json"
```

You should get JSON response with search results.

### 4.3 Check Backend Integration

Your backend should now log:
```
✅ SearXNG已连接
✅ SearXNG JSON支持已启用
🤖 Ollama + SearxNG Email Discovery activated
```

---

## 🎯 Complete Environment Variables Summary

### Backend Service (honest-hope)
```bash
PORT=3333
NODE_ENV=production

# Ollama (Modal)
OLLAMA_URL=https://luzgool--ollama-endpoint-serve.modal.run

# SearXNG (Railway)
SEARXNG_URL=https://your-searxng-domain.up.railway.app

# Redis (Railway)
REDIS_URL=redis://default:TiEqcsmnzAMgVlkNbppZUNmlzeSoBwbm@redis.railway.internal:6379

# SMTP (for email sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SENDER_NAME=MailGen
COMPANY_NAME=MailGen
```

### Frontend Service (mailgen)
```bash
VITE_API_URL=https://honest-hope-production.up.railway.app
```

### SearXNG Service
```bash
SEARXNG_SECRET=<your_random_secret>
SEARXNG_BASE_URL=${{RAILWAY_PUBLIC_DOMAIN}}
BIND_ADDRESS=0.0.0.0:8080
INSTANCE_NAME=Railway SearXNG
```

---

## 🔍 How It Works Together

```
┌─────────────────┐
│   Frontend      │
│   (Vite/React)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐      ┌──────────────┐      ┌─────────────┐
│   Backend       │─────→│   Ollama     │      │  SearXNG    │
│   (Node.js)     │      │   (Modal)    │      │  (Railway)  │
│                 │      │   AI Model   │      │  Web Search │
│ • Orchestrates  │      └──────────────┘      └──────┬──────┘
│ • Calls Ollama  │                                   │
│ • Calls SearXNG │←──────────────────────────────────┘
│ • Generates     │
│   Emails        │      ┌──────────────┐
└────────┬────────┘      │    Redis     │
         │               │   (Railway)  │
         │               │    Memory    │
         └───────────────┤              │
                         └──────────────┘
```

### Workflow:
1. Backend analyzes website using **Ollama AI**
2. Backend searches web using **SearXNG** to find prospects
3. **Ollama** generates personalized strategies
4. Backend finds emails using **SearXNG** search results
5. **Ollama** creates AI-powered user profiles
6. Backend generates personalized emails using **Ollama**
7. **Redis** stores memory and learning data

---

## 🐛 Troubleshooting

### SearXNG Build Fails

**Error:** "Cannot copy searxng-settings.yml"

**Solution:** Make sure you pushed the files to GitHub:
```bash
git status  # Check if files are committed
git push origin main
```

### SearXNG Returns 404

**Problem:** Service not exposing port correctly

**Solution:** Check in Railway:
1. Service → **Settings** → **Networking**
2. Ensure port 8080 is exposed
3. Public domain is generated

### Backend Can't Connect to SearXNG

**Problem:** SEARXNG_URL not set or incorrect

**Solution:**
1. Check **Backend** → **Variables** → `SEARXNG_URL`
2. Should be full URL: `https://your-domain.up.railway.app`
3. Test manually: `curl https://your-domain.up.railway.app/search?q=test&format=json`

### "SearXNG JSON support not enabled"

**Problem:** settings.yml not applied

**Solution:**
1. Check `searxng-settings.yml` has `formats: [html, json]`
2. Redeploy SearXNG service
3. Test: `curl "https://your-searxng.up.railway.app/search?q=test&format=json"`

---

## 📊 Cost Estimate

**SearXNG Service:**
- Memory: ~256-512MB
- CPU: Low usage
- **Cost**: ~$3-5/month

**Total Railway Cost (all services):**
- Backend: ~$8-12/month
- Frontend: ~$8-12/month
- Redis: ~$4-6/month
- SearXNG: ~$3-5/month
- **Total**: ~$23-35/month

---

## 🎉 Success Indicators

When everything is working, you should see:

### In Railway Backend Logs:
```
✅ Redis connected successfully
🤖 Ollama + SearxNG Email Discovery activated
   📊 Fast Model: qwen2.5:0.5b (analysis, strategy)
   🌐 搜索引擎: SearxNG (JSON格式)
   ⚡ 特色: 完全本地化智能邮箱发现
```

### In Modal Logs (Ollama):
```
Received request - model: qwen2.5:0.5b
Generated response length: XXX
```

### In SearXNG Service:
```
[INFO] searxng started
[INFO] listening on 0.0.0.0:8080
```

---

## 🔗 Useful Endpoints

- **Backend Health**: `https://your-backend.railway.app/health`
- **SearXNG Web**: `https://your-searxng.railway.app`
- **SearXNG API**: `https://your-searxng.railway.app/search?q=test&format=json`
- **Ollama Health**: `https://luzgool--ollama-endpoint-serve.modal.run/health`

---

## 📝 Next Steps After Deployment

1. Test a complete workflow from the frontend
2. Monitor Railway logs for all 3 services
3. Check Modal usage dashboard
4. Verify email discovery is working with real web search
5. Confirm AI-generated user profiles are being created

---

Need help? Check the logs in Railway for each service to see what's happening!
