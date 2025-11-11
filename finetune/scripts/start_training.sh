#!/bin/bash

# 激活虚拟环境
source /Users/songyanchao/Desktop/thing/zhishi/finetune/llama_env/bin/activate

# 进入 LLaMA-Factory 目录
cd /Users/songyanchao/Desktop/thing/zhishi/finetune/LLaMA-Factory

echo "🚀 启动 LLaMA-Factory Web UI..."
echo "📝 浏览器将自动打开 http://127.0.0.1:7860"
echo ""
echo "💡 使用说明："
echo "1. 在 Web UI 中选择模型: Qwen/Qwen2.5-3B-Instruct"
echo "2. 选择数据集: css_assistant"
echo "3. 选择微调方法: LoRA"
echo "4. 点击开始训练"
echo ""

# 启动 Web UI
python src/train_web.py
