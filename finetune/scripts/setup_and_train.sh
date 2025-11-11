#!/bin/bash

echo "======================================"
echo "CSS 助手模型微调 - 自动化脚本"
echo "======================================"

# 检查 Python 版本
echo ""
echo "[1/4] 检查 Python 环境..."
if command -v python3.11 &> /dev/null; then
    PYTHON_CMD=python3.11
elif command -v python3.10 &> /dev/null; then
    PYTHON_CMD=python3.10
elif command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
else
    echo "❌ 未找到 Python 3.10+ 环境"
    exit 1
fi

echo "✓ 使用 Python: $($PYTHON_CMD --version)"

# 创建虚拟环境
echo ""
echo "[2/4] 创建虚拟环境..."
if [ -d "train_env" ]; then
    echo "虚拟环境已存在，跳过创建"
else
    $PYTHON_CMD -m venv train_env
    echo "✓ 虚拟环境创建完成"
fi

# 激活虚拟环境并安装依赖
echo ""
echo "[3/4] 安装依赖包..."
source train_env/bin/activate

# 升级 pip
pip install --upgrade pip -q

# 安装核心依赖
echo "安装 PyTorch..."
pip install torch torchvision -q

echo "安装 Transformers 和 PEFT..."
pip install transformers peft datasets accelerate -q

echo "✓ 依赖安装完成"

# 开始训练
echo ""
echo "[4/4] 开始训练..."
echo "======================================"
echo ""

python simple_train.py

echo ""
echo "======================================"
echo "✓ 全部完成！"
echo "======================================"
