#!/usr/bin/env python3
"""
简化的 CSS 助手模型微调脚本
使用 Transformers + PEFT (LoRA) 直接训练
"""

import json
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForSeq2Seq
)
from peft import LoraConfig, get_peft_model, TaskType
from datasets import Dataset
import os

# 配置
MODEL_NAME = "Qwen/Qwen2.5-3B-Instruct"  # 基座模型
DATA_FILE = "training_data.json"  # 训练数据
OUTPUT_DIR = "./css_assistant_model"  # 输出目录
MAX_LENGTH = 512  # 最大序列长度

# LoRA 配置
LORA_R = 8  # LoRA 秩
LORA_ALPHA = 16  # LoRA alpha
LORA_DROPOUT = 0.05  # Dropout

# 训练配置
BATCH_SIZE = 4  # 批次大小（根据显存调整）
GRADIENT_ACCUMULATION_STEPS = 4  # 梯度累积
LEARNING_RATE = 2e-4  # 学习率
NUM_EPOCHS = 3  # 训练轮数
SAVE_STEPS = 500  # 保存间隔

print("=" * 60)
print("CSS 助手模型微调")
print("=" * 60)

# 1. 加载数据
print("\n[1/6] 加载训练数据...")
with open(DATA_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"✓ 加载了 {len(data)} 条训练数据")

# 2. 加载分词器和模型
print("\n[2/6] 加载模型和分词器...")
print(f"模型: {MODEL_NAME}")

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True,
    padding_side="right"
)

# 设置 pad_token
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device_map="auto" if torch.cuda.is_available() else None,
    trust_remote_code=True
)

print(f"✓ 模型加载完成")
print(f"  设备: {'CUDA' if torch.cuda.is_available() else 'CPU/MPS'}")
print(f"  参数量: {model.num_parameters() / 1e9:.2f}B")

# 3. 配置 LoRA
print("\n[3/6] 配置 LoRA...")
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=LORA_R,
    lora_alpha=LORA_ALPHA,
    lora_dropout=LORA_DROPOUT,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    bias="none"
)

model = get_peft_model(model, lora_config)
trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
all_params = sum(p.numel() for p in model.parameters())

print(f"✓ LoRA 配置完成")
print(f"  可训练参数: {trainable_params:,} ({100 * trainable_params / all_params:.2f}%)")
print(f"  总参数: {all_params:,}")

# 4. 准备数据集
print("\n[4/6] 准备数据集...")

def preprocess_function(example):
    """预处理单个样本"""
    instruction = example['instruction']
    input_text = example.get('input', '')
    output = example['output']
    
    # 格式化为 Qwen 格式
    if input_text:
        text = f"<|im_start|>system\n你是一个专业的 CSS 助手。<|im_end|>\n<|im_start|>user\n{instruction}\n{input_text}<|im_end|>\n<|im_start|>assistant\n{output}<|im_end|>"
    else:
        text = f"<|im_start|>system\n你是一个专业的 CSS 助手。<|im_end|>\n<|im_start|>user\n{instruction}<|im_end|>\n<|im_start|>assistant\n{output}<|im_end|>"
    
    # 分词
    model_inputs = tokenizer(
        text,
        truncation=True,
        max_length=MAX_LENGTH,
        padding=False,
    )
    
    # 设置 labels
    model_inputs["labels"] = model_inputs["input_ids"].copy()
    return model_inputs

# 转换为 Dataset 格式
dataset = Dataset.from_list(data)

# 处理数据集
tokenized_dataset = dataset.map(
    preprocess_function,
    remove_columns=dataset.column_names,
    desc="Tokenizing"
)

print(f"✓ 数据集准备完成")
print(f"  样本数: {len(tokenized_dataset)}")

# 5. 配置训练参数
print("\n[5/6] 配置训练参数...")
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=NUM_EPOCHS,
    per_device_train_batch_size=BATCH_SIZE,
    gradient_accumulation_steps=GRADIENT_ACCUMULATION_STEPS,
    learning_rate=LEARNING_RATE,
    lr_scheduler_type="cosine",
    warmup_ratio=0.1,
    logging_steps=10,
    save_steps=SAVE_STEPS,
    save_total_limit=3,
    fp16=torch.cuda.is_available(),
    bf16=False,
    optim="adamw_torch",
    report_to="none",
    remove_unused_columns=False,
)

print(f"✓ 训练参数配置完成")
print(f"  批次大小: {BATCH_SIZE}")
print(f"  梯度累积: {GRADIENT_ACCUMULATION_STEPS}")
print(f"  有效批次: {BATCH_SIZE * GRADIENT_ACCUMULATION_STEPS}")
print(f"  学习率: {LEARNING_RATE}")
print(f"  训练轮数: {NUM_EPOCHS}")

# 6. 开始训练
print("\n[6/6] 开始训练...")
print("=" * 60)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
    data_collator=DataCollatorForSeq2Seq(tokenizer=tokenizer, padding=True),
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
