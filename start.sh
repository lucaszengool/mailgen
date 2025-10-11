#!/bin/bash

# AI邮件营销助手启动脚本

echo "🚀 启动AI邮件营销助手..."
echo "📋 检查依赖..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查Ollama
echo "🤖 检查Ollama服务..."
if ! command -v ollama &> /dev/null; then
    echo "⚠️  未找到Ollama，请确保已安装Ollama"
    echo "📖 安装指南: https://ollama.ai/"
else
    echo "✅ Ollama已安装"
    
    # 检查Qwen2.5模型
    if ollama list | grep -q "qwen2.5:7b"; then
        echo "✅ Qwen2.5:7b模型已安装"
    else
        echo "⚠️  未找到Qwen2.5:7b模型"
        echo "正在下载Qwen2.5:7b模型..."
        ollama pull qwen2.5:7b
    fi
fi

# 启动服务
echo "🔧 启动后端服务器..."
node server/index.js &
BACKEND_PID=$!

echo "🎨 启动前端开发服务器..."
cd client && npm run dev &
FRONTEND_PID=$!

echo "✅ 系统启动成功！"
echo "📊 后端API: http://localhost:3333"
echo "🎯 前端界面: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
wait $BACKEND_PID $FRONTEND_PID