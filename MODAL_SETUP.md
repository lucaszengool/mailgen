# Modal.com Ollama Deployment Guide

This guide shows you how to deploy Ollama on Modal.com and connect it to your Railway backend.

---

## Step 1: Sign Up for Modal.com

1. Go to https://modal.com
2. Sign up for a free account (includes $30 free credits)
3. No credit card required for free tier

---

## Step 2: Install Modal CLI

Run these commands in your terminal:

```bash
# Install Modal
pip install modal

# Or if you prefer using pip3
pip3 install modal
```

---

## Step 3: Authenticate with Modal

```bash
# Login to Modal (this will open a browser)
modal token set

# Verify authentication
modal token show
```

---

## Step 4: Deploy Ollama to Modal

From your project directory (`/Users/James/Desktop/agent`):

```bash
# Deploy the Ollama endpoint
modal deploy modal_ollama.py
```

This will:
- Build a Docker image with Ollama installed
- Pull the AI models (qwen2.5:0.5b and llama3.2:1b)
- Deploy the service with GPU support (T4)
- Give you a public HTTPS endpoint

**Example output:**
```
✓ Created objects.
├── 🔨 Created mount /Users/James/Desktop/agent
├── 🔨 Created function OllamaEndpoint.*.
└── 🔨 Created web endpoint OllamaEndpoint.health => https://username--ollama-endpoint-health.modal.run
└── 🔨 Created web endpoint OllamaEndpoint.api_generate => https://username--ollama-endpoint-api-generate.modal.run
└── 🔨 Created web endpoint OllamaEndpoint.api_chat => https://username--ollama-endpoint-api-chat.modal.run
```

**Copy the endpoint URL** - you'll need it for Railway configuration!

---

## Step 5: Test Your Endpoint

Test that it's working:

```bash
# Test health check
curl https://username--ollama-endpoint-health.modal.run

# Test text generation
curl -X POST https://username--ollama-endpoint-api-generate.modal.run \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:0.5b",
    "prompt": "Write a professional email subject line about AI technology",
    "stream": false
  }'
```

---

## Step 6: Configure Railway Backend

1. Go to Railway Dashboard
2. Open your **Backend (honest-hope)** service
3. Go to **Variables** tab
4. Add/Update this variable:

```bash
OLLAMA_BASE_URL=https://username--ollama-endpoint-api-generate.modal.run
```

**Replace `username--ollama-endpoint-api-generate.modal.run` with your actual Modal endpoint URL!**

---

## Step 7: Update Backend Code (If Needed)

Your backend needs to call the Modal endpoint instead of `localhost:11434`.

If your backend uses Ollama's standard API format, the Modal endpoint is compatible.

**Standard Ollama API call:**
```javascript
// Before (localhost)
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'qwen2.5:0.5b',
    prompt: 'Your prompt here'
  })
});

// After (Modal)
const response = await fetch(process.env.OLLAMA_BASE_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'qwen2.5:0.5b',
    prompt: 'Your prompt here'
  })
});
```

---

## Cost Estimation

Modal.com pricing:
- **Free tier**: $30 credits (covers ~100 hours of T4 GPU usage)
- **T4 GPU**: ~$0.30/hour (only charged when in use)
- **Idle time**: Containers shut down after 5 minutes of inactivity (no charge)

**Example monthly cost:**
- 100 API calls/day × 2 seconds each = 200 seconds/day = ~1.7 hours/month
- Cost: ~$0.50/month (well within free tier)

---

## Available Models

The deployment includes:
- `qwen2.5:0.5b` - Fast, lightweight (500MB)
- `llama3.2:1b` - Slightly larger, better quality (1GB)

To add more models, edit `modal_ollama.py`:

```python
# Add this line in the ollama_image definition:
"ollama serve & sleep 5 && ollama pull llama3.2:3b",
```

Then redeploy:
```bash
modal deploy modal_ollama.py
```

---

## Monitoring Usage

Check your Modal dashboard:
1. Go to https://modal.com/apps
2. Click on "ollama-endpoint"
3. View metrics: requests, GPU time, costs

---

## Troubleshooting

### "GPU not available" error
Modal free tier includes GPU access. If you get this error:
- Check your Modal account status
- Try changing `gpu="T4"` to `gpu="any"` in modal_ollama.py

### "Model not found" error
The model might not have been pulled. Redeploy:
```bash
modal deploy modal_ollama.py
```

### Slow first request
First request might be slow (30-60s) as Modal spins up the container. Subsequent requests are fast.

### Connection timeout
Increase the timeout in your backend code:
```javascript
const response = await fetch(url, {
  // ... other options
  timeout: 60000  // 60 second timeout
});
```

---

## Alternative: Use Modal Storage for Models

For faster cold starts, you can store models in Modal's persistent storage:

```python
# Add to modal_ollama.py
volume = modal.Volume.from_name("ollama-models", create_if_missing=True)

@app.cls(
    image=ollama_image,
    gpu="T4",
    volumes={"/root/.ollama": volume}  # Persist models
)
class OllamaEndpoint:
    # ... rest of code
```

---

## Support

- Modal Docs: https://modal.com/docs
- Modal Slack: https://modal.com/slack
- Ollama Docs: https://github.com/ollama/ollama/blob/main/docs/api.md
