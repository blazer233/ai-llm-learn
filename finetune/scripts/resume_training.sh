#!/bin/bash

echo "======================================"
echo "恢复训练"
echo "======================================"
echo ""

# 检查是否有训练进程在运行
if ps aux | grep "simple_train.py" | grep -v grep > /dev/null; then
    echo "❌ 训练进程已在运行中"
    echo ""
    ps aux | grep "simple_train.py" | grep -v grep
    exit 1
fi

# 检查是否有保存的 checkpoint
LATEST_CHECKPOINT=""
if [ -d "css_assistant_model" ]; then
    LATEST_CHECKPOINT=$(find css_assistant_model -name "checkpoint-*" -type d | sort -V | tail -1)
fi

if [ -n "$LATEST_CHECKPOINT" ]; then
    echo "✓ 找到最新的 Checkpoint: $LATEST_CHECKPOINT"
    echo ""
    echo "⚠️  注意: 当前 simple_train.py 不支持从 checkpoint 恢复"
    echo "   需要修改脚本添加 resume_from_checkpoint 参数"
    echo ""
    read -p "是否从头开始重新训练？(y/n): " confirm
    
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "取消操作"
        exit 0
    fi
fi

echo ""
echo "开始训练..."
echo "======================================"
echo ""

# 激活虚拟环境并运行训练
source train_env/bin/activate
nohup python simple_train.py > training.log 2>&1 &

# 获取进程 ID
TRAIN_PID=$!

echo "✓ 训练已在后台启动"
echo "  进程 ID: $TRAIN_PID"
echo ""
echo "查看训练日志:"
echo "  tail -f training.log"
echo ""
echo "监控训练状态:"
echo "  ./monitor_training.sh"
echo ""
echo "暂停训练:"
echo "  ./pause_training.sh"
echo ""
echo "======================================"
