from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import load_dataset
import torch

# ========== 配置参数 ==========
MODEL_NAME = "Qwen/Qwen2-1.5B-Instruct"  # 推荐使用Qwen系列
OUTPUT_DIR = "./css_assistant_model"
MAX_LENGTH = 512  # CSS相关问答通常不需要太长

print("🚀 开始微调CSS类名助手...")

# ========== 加载模型 ==========
print("\n📥 加载模型和分词器...")
tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME, trust_remote_code=True, padding_side="right"  # 重要：设置padding方向
)

# 设置pad_token
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME, torch_dtype=torch.float16, device_map="auto", trust_remote_code=True
)

# ========== 配置LoRA ==========
print("\n⚙️ 配置LoRA...")
lora_config = LoraConfig(
    r=16,  # 增加秩以提高性能
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],  # 更多目标模块
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)

model = prepare_model_for_kbit_training(model)
model = get_peft_model(model, lora_config)

print("📊 可训练参数:")
model.print_trainable_parameters()

# ========== 加载数据 ==========
print("\n📂 加载训练数据...")
dataset = load_dataset("json", data_files="training_data.json", split="train")

print(f"✅ 加载了 {len(dataset)} 条训练数据")


# ========== 数据预处理 ==========
def format_prompt(example):
    """格式化为对话格式"""
    prompt = f"""<|im_start|>system
你是一个专业的CSS类名助手，帮助开发者快速查找和使用Tailwind风格的CSS类名。你的回答应该简洁、准确。<|im_end|>
<|im_start|>user
{example['instruction']}<|im_end|>
<|im_start|>assistant
{example['output']}<|im_end|>"""
    return {"text": prompt}


print("\n🔄 预处理数据...")
dataset = dataset.map(format_prompt, remove_columns=dataset.column_names)


def tokenize_function(examples):
    result = tokenizer(
        examples["text"],
        padding="max_length",
        truncation=True,
        max_length=MAX_LENGTH,
        return_tensors=None,
    )
    result["labels"] = result["input_ids"].copy()
    return result


tokenized_dataset = dataset.map(
    tokenize_function, batched=True, remove_columns=["text"]
)

# ========== 训练配置 ==========
print("\n⚙️ 配置训练参数...")
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=5,  # CSS数据较少，多训练几轮
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    lr_scheduler_type="cosine",
    warmup_steps=100,
    logging_steps=10,
    save_steps=50,
    save_total_limit=3,
    fp16=True,
    optim="adamw_torch",
    report_to="none",  # 不使用wandb等工具
)

# ========== 开始训练 ==========
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
    tokenizer=tokenizer,
    data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
)

print("\n🎯 开始训练...")
print("=" * 60)
trainer.train()

# ========== 保存模型 ==========
print("\n💾 保存模型...")
model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

print(f"\n✅ 训练完成！模型已保存到: {OUTPUT_DIR}")
print("\n下一步: 运行 test_model.py 测试模型效果")
