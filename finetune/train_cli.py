#!/usr/bin/env python3
"""
CSS 类名助手 - 命令行微调脚本
使用 Qwen2.5-3B-Instruct + QLoRA
"""

import os
import sys

# 添加 LLaMA-Factory 到路径
sys.path.insert(0, "/Users/songyanchao/Desktop/thing/zhishi/finetune/LLaMA-Factory/src")

from llamafactory.train.tuner import run_exp

def main():
    # 训练参数
    args = {
        # 模型配置
        "model_name_or_path": "Qwen/Qwen2.5-3B-Instruct",
        "trust_remote_code": True,
        
        # 数据配置
        "dataset": "css_assistant",
        "template": "qwen",
        "cutoff_len": 512,
        "max_samples": 10406,
        "overwrite_cache": True,
        "preprocessing_num_workers": 4,
        
        # LoRA 配置
        "finetuning_type": "lora",
        "lora_rank": 8,
        "lora_alpha": 16,
        "lora_dropout": 0.05,
        "lora_target": "all",
        
        # 训练参数
        "stage": "sft",
        "do_train": True,
        "output_dir": "/Users/songyanchao/Desktop/thing/zhishi/finetune/output_model",
        "overwrite_output_dir": True,
        
        # 优化器配置
        "per_device_train_batch_size": 2,
        "gradient_accumulation_steps": 4,
        "learning_rate": 5e-5,
        "num_train_epochs": 3,
        "lr_scheduler_type": "cosine",
        "warmup_ratio": 0.1,
        
        # 保存配置
        "save_steps": 500,
        "logging_steps": 10,
        "save_total_limit": 3,
        
        # 其他配置
        "fp16": False,
        "bf16": True,
        "ddp_timeout": 180000000,
        "report_to": "none",
    }
    
    print("=" * 60)
    print("🚀 开始微调 CSS 类名助手")
    print("=" * 60)
    print(f"📦 基座模型: {args['model_name_or_path']}")
    print(f"📊 数据集: {args['dataset']} ({args['max_samples']} 条)")
    print(f"🔧 微调方法: LoRA (rank={args['lora_rank']})")
    print(f"📈 训练轮数: {args['num_train_epochs']}")
    print(f"💾 输出目录: {args['output_dir']}")
    print("=" * 60)
    print()
    
    # 开始训练
    try:
        run_exp(args)
        print("\n" + "=" * 60)
        print("✅ 训练完成！")
        print(f"📁 模型保存在: {args['output_dir']}")
        print("=" * 60)
    except Exception as e:
        print(f"\n❌ 训练失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
