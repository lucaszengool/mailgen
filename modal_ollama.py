"""
Ollama deployment on Modal.com
This deploys Ollama as a serverless endpoint compatible with Ollama's API format
"""

import modal
from typing import Dict, Optional
from fastapi import Request
from fastapi.responses import JSONResponse

# Create Modal app
app = modal.App("ollama-endpoint")

# Create a custom image with Ollama installed
ollama_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("fastapi", "pydantic")
    .apt_install("curl", "ca-certificates")
    .run_commands(
        # Install Ollama
        "curl -fsSL https://ollama.com/install.sh | sh"
    )
)

# Main generate endpoint - matches Ollama's /api/generate format
@app.function(
    image=ollama_image,
    gpu="T4",  # Use T4 GPU (cheapest option on Modal)
    timeout=600,  # 10 minute timeout for long requests
    scaledown_window=300,  # Keep alive for 5 minutes
)
@modal.asgi_app()
def serve():
    """
    ASGI app that provides Ollama-compatible /api/generate endpoint
    """
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
    import subprocess
    import json
    import time
    import os

    web_app = FastAPI()

    # Start Ollama server when container starts
    print("Starting Ollama server...")
    ollama_proc = subprocess.Popen(
        ["ollama", "serve"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={**os.environ, "OLLAMA_HOST": "0.0.0.0:11434"}
    )
    time.sleep(5)  # Give Ollama time to start
    print("Ollama server started")

    @web_app.post("/api/generate")
    async def generate(request: Request):
        """
        Ollama-compatible /api/generate endpoint
        Request format: {"model": "qwen2.5:0.5b", "prompt": "...", "stream": false}
        Response format: {"model": "...", "response": "...", "done": true}
        """
        try:
            body = await request.json()
            model = body.get("model", "qwen2.5:0.5b")
            prompt = body.get("prompt", "")
            stream = body.get("stream", False)

            print(f"Received request - model: {model}, prompt length: {len(prompt)}")

            # Pull model if needed (only first time)
            print(f"Ensuring model {model} is available...")
            pull_result = subprocess.run(
                ["ollama", "pull", model],
                capture_output=True,
                text=True,
                timeout=300
            )

            if pull_result.returncode != 0:
                print(f"Model pull warning: {pull_result.stderr}")

            # Generate response using Ollama API
            print("Calling Ollama to generate response...")
            result = subprocess.run(
                ["curl", "-X", "POST", "http://localhost:11434/api/generate",
                 "-H", "Content-Type: application/json",
                 "-d", json.dumps({
                     "model": model,
                     "prompt": prompt,
                     "stream": False,
                     "options": body.get("options", {})
                 })],
                capture_output=True,
                text=True,
                timeout=300
            )

            if result.returncode == 0:
                response_data = json.loads(result.stdout)
                print(f"Generated response length: {len(response_data.get('response', ''))}")
                return JSONResponse(content=response_data)
            else:
                error_msg = f"Ollama generation failed: {result.stderr}"
                print(error_msg)
                return JSONResponse(
                    status_code=500,
                    content={"error": error_msg}
                )

        except Exception as e:
            error_msg = f"Error in generate endpoint: {str(e)}"
            print(error_msg)
            return JSONResponse(
                status_code=500,
                content={"error": error_msg}
            )

    @web_app.post("/api/chat")
    async def chat(request: Request):
        """
        Ollama-compatible /api/chat endpoint
        """
        try:
            body = await request.json()
            model = body.get("model", "qwen2.5:0.5b")
            messages = body.get("messages", [])

            print(f"Chat request - model: {model}, messages: {len(messages)}")

            # Pull model if needed
            subprocess.run(
                ["ollama", "pull", model],
                capture_output=True,
                timeout=300
            )

            # Call Ollama chat API
            result = subprocess.run(
                ["curl", "-X", "POST", "http://localhost:11434/api/chat",
                 "-H", "Content-Type: application/json",
                 "-d", json.dumps({
                     "model": model,
                     "messages": messages,
                     "stream": False,
                     "options": body.get("options", {})
                 })],
                capture_output=True,
                text=True,
                timeout=300
            )

            if result.returncode == 0:
                return JSONResponse(content=json.loads(result.stdout))
            else:
                return JSONResponse(
                    status_code=500,
                    content={"error": f"Chat failed: {result.stderr}"}
                )

        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"error": str(e)}
            )

    @web_app.get("/health")
    async def health():
        """Health check endpoint"""
        return {"status": "ok", "service": "ollama-modal"}

    @web_app.get("/")
    async def root():
        """Root endpoint with API info"""
        return {
            "service": "Ollama on Modal",
            "endpoints": ["/api/generate", "/api/chat", "/health"],
            "status": "running"
        }

    return web_app
