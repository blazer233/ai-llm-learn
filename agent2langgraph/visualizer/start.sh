#!/bin/bash

echo "🚀 启动 LangGraph 工作流可视化..."
echo ""

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
  echo "📦 首次运行，正在安装依赖..."
  npm install
  echo ""
fi

echo "🎨 启动开发服务器..."
npm run dev
