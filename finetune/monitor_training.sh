#!/bin/bash

echo "======================================"
echo "训练监控"
echo "======================================"
echo ""

# 检查训练进程
if ps aux | grep "simple_train.py" | grep -v grep > /dev/null; then
    echo "✓ 训练进程正在运行"
    echo ""
    
    # 显示进程信息
    echo "进程信息:"
    ps aux | grep "simple_train.py" | grep -v grep | awk '{printf "  PID: %s\n  CPU: %s%%\n  内存: %s%%\n  运行时间: %s\n", $2, $3, $4, $10}'
    echo ""
    
    # 检查输出目录
    if [ -d "css_assistant_model" ]; then
        echo "模型输出目录:"
        ls -lh css_assistant_model/ | tail -10
        echo ""
    fi
    
    # 检查最新的 checkpoint
    if [ -d "css_assistant_model" ]; then
        echo "Checkpoints:"
        find css_assistant_model -name "checkpoint-*" -type d | sort
        echo ""
    fi
    
else
    echo "❌ 训练进程未运行"
    echo ""
    
    # 检查是否已完成
    if [ -d "css_assistant_model" ] && [ -f "css_assistant_model/adapter_config.json" ]; then
        echo "✓ 训练可能已完成！"
        echo ""
        echo "模型文件:"
        ls -lh css_assistant_model/
    fi
fi

echo "======================================"
