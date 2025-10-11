#!/bin/bash
"""
设置本地网络搜索LLM系统
安装 SearxNG + Ollama + Function Calling
"""

echo "🚀 设置本地网络搜索LLM系统..."
echo "=" * 50

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    echo "💡 安装指令: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker已安装"

# 检查Ollama是否运行
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama已运行"
else
    echo "❌ Ollama未运行，请先启动Ollama"
    echo "💡 启动指令: ollama serve"
    exit 1
fi

# 停止并删除现有的SearxNG容器（如果存在）
echo "🧹 清理现有SearxNG容器..."
docker stop searxng 2>/dev/null || true
docker rm searxng 2>/dev/null || true

# 启动SearxNG
echo "🔍 启动SearxNG搜索引擎..."
docker run -d \
    --name searxng \
    -p 8080:8080 \
    -e SEARXNG_SECRET="$(openssl rand -hex 32)" \
    -e SEARXNG_BASE_URL="http://localhost:8080" \
    searxng/searxng:latest

echo "⏱️  等待SearxNG启动..."
sleep 10

# 测试SearxNG
for i in {1..30}; do
    if curl -s "http://localhost:8080/search?q=test&format=json" > /dev/null; then
        echo "✅ SearxNG成功启动! (http://localhost:8080)"
        break
    fi
    echo "   等待中... ($i/30)"
    sleep 2
done

# 验证SearxNG API
echo "🧪 测试SearxNG API..."
response=$(curl -s "http://localhost:8080/search?q=test&format=json")
if [[ $response == *"results"* ]]; then
    echo "✅ SearxNG API正常工作"
else
    echo "❌ SearxNG API测试失败"
    exit 1
fi

# 安装Python依赖
echo "📦 安装Python依赖..."
pip3 install requests beautifulsoup4 docker

# 检查Ollama模型
echo "🧠 检查Ollama模型..."
if ollama list | grep -q "llama3.2"; then
    echo "✅ llama3.2 模型已安装"
else
    echo "📥 下载 llama3.2 模型..."
    ollama pull llama3.2
fi

if ollama list | grep -q "qwen2.5:0.5b"; then
    echo "✅ qwen2.5:0.5b 模型已安装"
else
    echo "📥 下载 qwen2.5:0.5b 模型..."
    ollama pull qwen2.5:0.5b
fi

echo ""
echo "🎉 本地网络搜索LLM系统设置完成!"
echo ""
echo "🔧 系统组件:"
echo "   🔍 SearxNG: http://localhost:8080 (聚合210+搜索引擎)"
echo "   🧠 Ollama: http://localhost:11434 (本地LLM)"
echo "   🛠️  Function Calling: Web Search + Email Extraction"
echo ""
echo "🚀 使用方法:"
echo "   python3 SearxNGLocalLLM.py 'AI startup' 5"
echo ""
echo "✅ 完全本地，零外部API依赖!"