"""
RunPod Serverless Ollama Deployment
Much cheaper than Modal - only pays per-second of actual usage!

Cost comparison:
- Modal T4: $0.60/hr with min_containers=1 = $432/month
- RunPod A6000 (48GB): $0.31/hr, per-second billing = ~$50-100/month
"""

import runpod
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import subprocess
import json
import time
import os

# Initialize Ollama when handler starts
def initialize_ollama():
    """Start Ollama server and pre-load model"""
    print("🚀 Starting Ollama server...")

    # Start Ollama in background
    ollama_proc = subprocess.Popen(
        ["ollama", "serve"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={**os.environ, "OLLAMA_HOST": "0.0.0.0:11434"}
    )
    time.sleep(5)

    # Pre-load model
    model = os.getenv("OLLAMA_MODEL", "qwen2.5:0.5b")
    print(f"📦 Pre-loading model: {model}")
    subprocess.run(["ollama", "pull", model], capture_output=True)

    print("✅ Ollama ready!")
    return ollama_proc


def handler(event):
    """
    RunPod serverless handler
    Receives: {"input": {"model": "qwen2.5:0.5b", "prompt": "...", "stream": false}}
    Returns: {"model": "...", "response": "...", "done": true}
    """
    try:
        # Extract request data
        input_data = event.get("input", {})
        model = input_data.get("model", "qwen2.5:0.5b")
        prompt = input_data.get("prompt", "")
        options = input_data.get("options", {})

        print(f"📥 Request - model: {model}, prompt length: {len(prompt)}")

        # Ensure model is available
        subprocess.run(["ollama", "pull", model], capture_output=True)

        # Call Ollama API
        result = subprocess.run(
            ["curl", "-s", "-X", "POST", "http://localhost:11434/api/generate",
             "-H", "Content-Type: application/json",
             "-d", json.dumps({
                 "model": model,
                 "prompt": prompt,
                 "stream": False,
                 "options": options
             })],
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )

        if result.returncode == 0:
            response_data = json.loads(result.stdout)
            print(f"✅ Generated {len(response_data.get('response', ''))} chars")
            return response_data
        else:
            error_msg = f"Generation failed: {result.stderr}"
            print(f"❌ {error_msg}")
            return {"error": error_msg}

    except Exception as e:
        error_msg = f"Handler error: {str(e)}"
        print(f"❌ {error_msg}")
        return {"error": error_msg}


if __name__ == "__main__":
    # Initialize Ollama once
    initialize_ollama()

    # Start RunPod serverless handler
    print("🎯 Starting RunPod handler...")
    runpod.serverless.start({"handler": handler})
