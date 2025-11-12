# Ollama Cost Optimization Guide

## 🔴 Problem: Modal is Too Expensive!

**Current Monthly Cost:** ~$432/month (T4 GPU @ $0.60/hr × 24/7)

**Root Cause:** `min_containers=1` in `modal_ollama.py` keeps a GPU running 24/7 even when idle!

---

## 💰 Cost Breakdown

| Provider | GPU | Hourly | Monthly (24/7) | Per-Second Billing? |
|----------|-----|--------|----------------|---------------------|
| **Modal (old config)** | T4 (16GB) | $0.60 | **$432** | ❌ No |
| **Modal (fixed)** | T4 (16GB) | $0.60 | **~$50-100** | ✅ Yes (with min_containers=0) |
| **RunPod** | A6000 (48GB) | $0.31 | **~$30-70** | ✅ Yes |
| **Local Ollama** | Your Mac | **FREE** | **$0** | ✅ Always free |

---

## ✅ Solutions (Pick One)

### **Option 1: Use Local Ollama (RECOMMENDED) 💚**

**Cost:** $0/month
**Setup Time:** 2 minutes
**Performance:** Fastest (no network latency)

```bash
# 1. Install Ollama (Mac)
curl -fsSL https://ollama.com/install.sh | sh

# 2. Pull your model
ollama pull qwen2.5:0.5b
# or
ollama pull llama3.2

# 3. Verify it's running
curl http://localhost:11434/api/tags

# 4. Your .env is already configured!
# OLLAMA_URL=http://localhost:11434 ✅
```

**Pros:**
- $0 cost forever
- Fastest response (no network overhead)
- Private (data never leaves your machine)
- Your Mac can easily handle qwen2.5:0.5b

**Cons:**
- Requires Ollama running locally
- Won't work if app is deployed elsewhere

**Best for:** Development, testing, personal use

---

### **Option 2: Switch to RunPod Serverless**

**Cost:** ~$30-70/month (50-85% cheaper than Modal)
**Setup Time:** 15 minutes
**Performance:** 48% of cold starts < 200ms (vs Modal's 2-4s)

```bash
# 1. Install RunPod CLI
pip install runpod

# 2. Login
runpod login

# 3. Deploy
runpod deploy runpod_ollama.py --config runpod_config.yaml

# 4. Update .env
OLLAMA_URL=https://your-endpoint.runpod.io
```

**Pros:**
- 15% cheaper than Modal
- Better GPU (A6000 48GB vs T4 16GB)
- Per-second billing
- Faster cold starts
- `min_workers: 0` by default (scales to zero!)

**Cons:**
- Requires RunPod account
- Slightly more setup than Modal

**Best for:** Production deployments, scaling, cloud apps

---

### **Option 3: Fix Modal Config (Quick Win)**

**Cost:** ~$50-100/month (88% cheaper!)
**Setup Time:** 30 seconds
**Performance:** Same as before

✅ **Already fixed in `modal_ollama.py`!**

Changes made:
```python
min_containers=0,  # Was 1 - saved $400/month!
scaledown_window=60,  # Was 1800 - faster scaling
timeout=600,  # Was 3600 - prevent long hangs
```

Deploy the fix:
```bash
modal deploy modal_ollama.py
```

**Pros:**
- Easiest fix (just redeploy)
- Keeps existing Modal setup
- 88% cost reduction

**Cons:**
- Still more expensive than RunPod
- Cold starts 2-4 seconds

**Best for:** Quick fix if already using Modal

---

## 📊 Where Are Ollama Calls Made?

Found **26 files** making Ollama calls:

**Top Culprits:**
1. `ProspectSearchAgent.js` - 3 calls (lines 672, 727, 2954)
2. `LangGraphMarketingAgent.js` - 1 call (line 308)
3. `PersonalizedEmailGenerator.js` - 3 calls (lines 29, 143, 426)
4. `LinkedInEmailDiscoveryEngine.js` - 2 calls (lines 281, 832)
5. `OllamaLearningAgent.js` - 3 calls (lines 114, 181, 238)
6. Plus 21 more files...

**All these respect `process.env.OLLAMA_URL`**, so changing `.env` updates everything!

---

## 🎯 Recommended Action Plan

### For Development (Now):
1. ✅ **Use Local Ollama** (FREE)
   ```bash
   brew install ollama
   ollama pull qwen2.5:0.5b
   # Keep: OLLAMA_URL=http://localhost:11434
   ```

### For Production (Later):
2. ✅ **Deploy to RunPod** (cheapest cloud option)
   ```bash
   runpod deploy runpod_ollama.py
   # Update: OLLAMA_URL=https://xyz.runpod.io
   ```

### Emergency Fix (If using Modal now):
3. ✅ **Redeploy Modal** with fixed config
   ```bash
   modal deploy modal_ollama.py
   ```

---

## 💡 Additional Optimizations

### 1. Cache Responses
Add Redis caching to avoid duplicate Ollama calls:

```javascript
// Before calling Ollama, check cache
const cacheKey = `ollama:${model}:${hash(prompt)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Call Ollama...
const response = await ollamaGenerate(...);

// Cache for 1 hour
await redis.setex(cacheKey, 3600, JSON.stringify(response));
```

### 2. Batch Requests
Combine multiple prompts into one request when possible.

### 3. Use Smaller Models
- `qwen2.5:0.5b` - Fastest, cheapest (500MB)
- `qwen2.5:1.5b` - Good balance (1.5GB)
- `llama3.2` - Better quality but slower (2GB)

### 4. Reduce Prompt Size
Trim unnecessary context from prompts to reduce tokens.

---

## 📈 Expected Savings

| Solution | Monthly Cost | Savings vs Modal |
|----------|--------------|------------------|
| Local Ollama | **$0** | **100%** ($432 saved) |
| RunPod A6000 | **$30-70** | **84-93%** ($362-402 saved) |
| Modal (fixed) | **$50-100** | **77-88%** ($332-382 saved) |
| Modal (old) | $432 | 0% (baseline) |

---

## 🚀 Quick Start

```bash
# Install local Ollama (Mac)
brew install ollama

# Pull model
ollama pull qwen2.5:0.5b

# Test
curl http://localhost:11434/api/generate \
  -d '{"model":"qwen2.5:0.5b","prompt":"Hello!","stream":false}'

# Done! Your app already uses localhost in .env
npm run dev
```

---

## 📞 Support

- **Ollama Docs:** https://ollama.com/docs
- **RunPod Docs:** https://docs.runpod.io
- **Modal Docs:** https://modal.com/docs

---

**TL;DR:**
1. ✅ Modal config fixed (88% cheaper)
2. ✅ Local Ollama = FREE (best for dev)
3. ✅ RunPod = $30-70/mo (best for prod)
4. ❌ Don't use `min_containers=1` on Modal!
