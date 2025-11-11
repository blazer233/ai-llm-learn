#!/bin/bash

echo "======================================"
echo "暂停训练"
echo "======================================"
echo ""

# 查找训练进程
PID=$(ps aux | grep "simple_train.py" | grep -v grep | awk '{print $2}')

if [ -z "$PID" ]; then
    echo "❌ 未找到运行中的训练进程"
    exit 1
fi

echo "找到训练进程: PID $PID"
echo ""

# 显示进程信息
echo "进程信息:"
ps aux | grep "simple_train.py" | grep -v grep | awk '{printf "  PID: %s\n  CPU: %s%%\n  内存: %s%%\n  运行时间: %s\n", $2, $3, $4, $10}'
echo ""

# 询问确认
read -p "确认要暂停训练吗？(y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "取消操作"
    exit 0
fi

echo ""
echo "正在暂停训练..."

# 发送 SIGINT 信号（相当于 Ctrl+C）
kill -INT $PID

# 等待进程结束
echo "等待进程安全退出..."
sleep 3

# 检查进程是否已结束
if ps -p $PID > /dev/null 2>&1; then
    echo "⚠️  进程仍在运行，尝试强制终止..."
    kill -9 $PID
    sleep 1
fi

# 最终检查
if ps -p $PID > /dev/null 2>&1; then
    echo "❌ 无法终止进程"
    exit 1
else
    echo "✓ 训练已暂停"
fi

echo ""
echo "======================================"
echo "检查保存的 Checkpoint"
echo "======================================"

# 检查是否有保存的 checkpoint
if [ -d "css_assistant_model" ]; then
    echo ""
    echo "已保存的 Checkpoints:"
    find css_assistant_model -name "checkpoint-*" -type d | sort
    echo ""
    echo "模型文件:"
    ls -lh css_assistant_model/ | grep -v "^d" | grep -v "^total"
else
    echo "⚠️  未找到保存的模型文件"
    echo "   训练可能还未到第一个保存点（500步）"
fi

echo ""
echo "======================================"
echo "如需恢复训练，请查看 TRAINING_STATUS.md"
echo "======================================"
