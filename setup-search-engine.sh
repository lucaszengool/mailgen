#!/bin/bash

# Super Power Email Search Engine Setup Script
# Sets up SearXNG + Ollama for real web-based email search

echo "🚀 Setting up Super Power Email Search Engine"
echo "=" | tr ' ' '=' | head -c 60; echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Step 1: Setup SearXNG
echo "📦 Step 1: Setting up SearXNG (Privacy-focused meta search engine)"

# Create necessary directories
mkdir -p searxng filtron

# Generate secret key for SearXNG
SECRET_KEY=$(openssl rand -hex 32)
echo "🔑 Generated secret key: $SECRET_KEY"

# Update docker-compose file with secret key
sed -i.bak "s/please_change_this_secret_key/$SECRET_KEY/g" docker-compose.searxng.yml

echo "🐳 Starting SearXNG containers..."
docker-compose -f docker-compose.searxng.yml up -d

# Wait for SearXNG to start
echo "⏳ Waiting for SearXNG to start..."
sleep 10

# Test SearXNG
echo "🧪 Testing SearXNG connection..."
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ SearXNG is running at http://localhost:8080"
else
    echo "❌ SearXNG failed to start. Check docker logs:"
    echo "   docker-compose -f docker-compose.searxng.yml logs"
    exit 1
fi

# Step 2: Setup Ollama
echo
echo "🤖 Step 2: Setting up Ollama (Local LLM)"

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "📥 Installing Ollama..."
    
    # Detect OS and install accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo "🍎 Detected macOS - Please install Ollama manually:"
        echo "   1. Visit https://ollama.ai/download"
        echo "   2. Download and install Ollama for macOS"
        echo "   3. Run: ollama serve"
        echo "   4. Run: ollama run llama2"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://ollama.ai/install.sh | sh
    else
        echo "❌ Unsupported OS. Please install Ollama manually from https://ollama.ai"
        exit 1
    fi
else
    echo "✅ Ollama is already installed"
fi

# Check if Ollama is running
echo "🧪 Testing Ollama connection..."
if curl -s http://localhost:11434/api/version > /dev/null; then
    echo "✅ Ollama is running at http://localhost:11434"
else
    echo "⚠️  Ollama is not running. Please start it:"
    echo "   ollama serve &"
    echo "   Then run: ollama run llama2"
fi

# Step 3: Setup environment variables
echo
echo "📝 Step 3: Setting up environment variables"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cat > .env << EOF
# Super Power Email Search Engine Configuration
SEARXNG_URL=http://localhost:8080
OLLAMA_URL=http://localhost:11434

# Multi-Model Ollama Configuration (Optimized for Performance)
OLLAMA_FAST_MODEL=qwen2.5:0.5b      # Fast lightweight model for analysis, search queries  
OLLAMA_MODEL=qwen2.5:0.5b          # General purpose model
OLLAMA_EMAIL_MODEL=llama3.2         # High-quality model for email generation

# Optional: ScrapingDog API (if you have it)
# SCRAPINGDOG_API_KEY=your_api_key_here

# Optional: Hunter.io API (if you have it)
# HUNTER_API_KEY=your_api_key_here

# Optional: Apollo.io API (if you have it)
# APOLLO_API_KEY=your_api_key_here
EOF
    echo "✅ Created .env file with default configuration"
else
    echo "✅ .env file already exists"
fi

# Step 4: Download and prepare LLM models
echo
echo "🧠 Step 4: Preparing LLM models"

if command -v ollama &> /dev/null; then
    echo "📥 Downloading qwen2.5:0.5b model (fast for analysis and search queries)..."
    ollama pull qwen2.5:0.5b
    echo "✅ qwen2.5:0.5b model downloaded"
    
    echo "📥 Downloading llama3.2 model (high-quality for email generation)..."
    ollama pull llama3.2
    echo "✅ llama3.2 model downloaded"
    
    echo "🎯 Optimized multi-model setup complete:"
    echo "   📊 Fast Model: qwen2.5:0.5b (analysis, search queries - quick responses)"
    echo "   📧 Email Model: llama3.2 (email generation - better quality)"
    echo ""
    echo "💡 Performance Benefits:"
    echo "   • Faster analysis and search query generation"
    echo "   • Higher quality email content generation"
    echo "   • Optimized resource usage per task type"
else
    echo "⚠️  Please install Ollama first, then run:"
    echo "   ollama pull qwen2.5:0.5b"
    echo "   ollama pull llama3.2"
fi

# Step 5: Test the complete system
echo
echo "🧪 Step 5: Testing the complete system"

# Run the test script
if [ -f "test-super-power-engine.js" ]; then
    echo "🚀 Running Super Power Email Search Engine test..."
    node test-super-power-engine.js
else
    echo "⚠️  Test script not found. Please run manually:"
    echo "   node test-super-power-engine.js"
fi

echo
echo "=" | tr ' ' '=' | head -c 60; echo
echo "🎉 Setup completed!"
echo
echo "🌟 Your Super Power Email Search Engine is now ready:"
echo "   ⚡ SearXNG: http://localhost:8080 (Meta search engine)"
echo "   🤖 Ollama: http://localhost:11434 (Local LLM)"
echo "   📧 Email Agent: Integrated with real web search"
echo
echo "🚀 To start your email marketing system:"
echo "   npm start"
echo
echo "🔧 Troubleshooting:"
echo "   - Check SearXNG: docker-compose -f docker-compose.searxng.yml logs"
echo "   - Check Ollama: ollama serve"
echo "   - Test manually: node test-super-power-engine.js"
echo
echo "📚 Documentation:"
echo "   - SearXNG: https://docs.searxng.org/"
echo "   - Ollama: https://github.com/ollama/ollama"