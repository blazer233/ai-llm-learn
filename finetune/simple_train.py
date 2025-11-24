#!/usr/bin/env python3
"""
简化的 CSS 助手模型微调脚本 - Mac 优化版本
使用 Transformers + PEFT (LoRA) 直接训练
针对 Mac 性能优化，使用轻量化配置
"""

import json
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer
)
from peft import LoraConfig, get_peft_model
from datasets import load_dataset
import os

# 配置
MODEL_NAME = "Qwen/Qwen2.5-1.5B-Instruct"  # 基座模型（更小的 1.5B 模型）
DATA_FILE = "training_data.json"  # 训练数据
OUTPUT_DIR = "./css_assistant_model"  # 输出目录
MAX_LENGTH = 512  # 最大序列长度

# LoRA 配置（轻量化，适合 Mac）
LORA_R = 5  # LoRA 秩（从8降到5，减少可训练参数）
LORA_ALPHA = 32  # LoRA alpha（增大缩放因子）
LORA_DROPOUT = 0.05  # Dropout

# 训练配置（Mac 优化）
BATCH_SIZE = 2  # 批次大小（从4降到2，节省内存）
GRADIENT_ACCUMULATION_STEPS = 4  # 梯度累积
LEARNING_RATE = 2e-4  # 学习率
NUM_EPOCHS = 3  # 训练轮数

print("=" * 60)
print("CSS 助手模型微调 (Mac 优化版 - 1.5B 小模型)")
print("=" * 60)

# 1. 加载分词器
print("\n[1/5] 加载分词器...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token
print(f"✓ 分词器加载完成")

# 2. 加载训练数据
print("\n[2/5] 加载训练数据...")
dataset = load_dataset("json", data_files=DATA_FILE)["train"]
print(f"✓ 加载了 {len(dataset)} 条训练数据")

# 3. 数据预处理
print("\n[3/5] 数据预处理...")
def preprocess_function(examples):
    """预处理函数 - 简化版"""
    instruction = examples['instruction']
    input_text = examples.get('input', '')
    output = examples['output']
    
    # 格式化为 Qwen 格式
    if input_text:
        text = f"<|im_start|>system\n你是一个专业的 CSS 助手。<|im_end|>\n<|im_start|>user\n{instruction}\n{input_text}<|im_end|>\n<|im_start|>assistant\n{output}<|im_end|>"
    else:
        text = f"<|im_start|>system\n你是一个专业的 CSS 助手。<|im_end|>\n<|im_start|>user\n{instruction}<|im_end|>\n<|im_start|>assistant\n{output}<|im_end|>"
    
    # 编码输入
    inputs = tokenizer(
        text,
        truncation=True,
        max_length=MAX_LENGTH,
        padding="max_length",
        return_tensors=None  # 必须为 None
    )
    inputs["labels"] = inputs["input_ids"].copy()
    return inputs

tokenized_dataset = dataset.map(preprocess_function, remove_columns=dataset.column_names)
print(f"✓ 数据集预处理完成")

# 4. LoRA 配置
print("\n[4/5] 配置 LoRA...")
lora_config = LoraConfig(
    r=LORA_R,
    lora_alpha=LORA_ALPHA,
    target_modules=["q_proj", "v_proj"],  # 仅 2 个模块（轻量化）
    lora_dropout=LORA_DROPOUT,
    bias="none",
    task_type="CAUSAL_LM"
)

# 加载模型
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    device_map="auto",  # 自动分配到 MPS（Apple GPU）
    torch_dtype=torch.float16,  # 使用 float16 精度
    trust_remote_code=True
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()  # 打印可训练参数
print(f"✓ LoRA 配置完成")

# 5. 训练配置
print("\n[5/5] 配置训练参数...")
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    per_device_train_batch_size=BATCH_SIZE,  # Mac 优化：批次大小 2
    gradient_accumulation_steps=GRADIENT_ACCUMULATION_STEPS,
    num_train_epochs=NUM_EPOCHS,
    learning_rate=LEARNING_RATE,
    logging_dir="./logs",
    logging_steps=10,
    save_strategy="epoch"  # 每个 epoch 保存一次
)

print(f"✓ 训练参数配置完成")
print(f"  批次大小: {BATCH_SIZE}")
print(f"  梯度累积: {GRADIENT_ACCUMULATION_STEPS}")
print(f"  有效批次: {BATCH_SIZE * GRADIENT_ACCUMULATION_STEPS}")
print(f"  学习率: {LEARNING_RATE}")
print(f"  训练轮数: {NUM_EPOCHS}")
print(f"  LoRA 秩: {LORA_R} (轻量化配置)")

# 开始训练
print("\n开始训练...")
print("=" * 60)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset
)

trainer.train()

# 保存模型
print("\n保存模型...")
model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

print("\n" + "=" * 60)
print("✓ 训练完成！")
print(f"模型已保存到: {OUTPUT_DIR}")
print("=" * 60)
print("\n💡 提示：")
print("  - 本次使用 Mac 优化配置（LoRA r=5, batch=2）")
print("  - 可训练参数约占总参数的 0.1%")
print("  - 如果内存仍不足，可将 BATCH_SIZE 改为 1")

