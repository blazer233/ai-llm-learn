# 快速开始指南

> 5 分钟快速上手 CSS 助手模型微调

## 🎯 三步开始训练

### 第一步：进入项目目录
```bash
cd /Users/songyanchao/Desktop/thing/zhishi/finetune
```

### 第二步：启动训练
```bash
./scripts/setup_and_train.sh
```

### 第三步：等待完成
训练时间：2-4 小时（M1/M2 Mac）

---

## 📋 常用命令速查

### 训练管理
```bash
# 监控训练
./scripts/monitor_training.sh

# 暂停训练
./scripts/pause_training.sh

# 恢复训练
./scripts/resume_training.sh

# 查看日志
tail -f training.log
```

### 数据处理
```bash
# 检查数据质量
python check_data_quality.py

# 重新处理数据
python process_data.py
```

---

## 🔍 训练状态检查

### 检查进程
```bash
ps aux | grep simple_train.py
```

### 检查输出
```bash
ls -lh css_assistant_model/
```

### 检查 Checkpoints
```bash
ls css_assistant_model/checkpoint-*
```

---

## 💡 快速测试模型

训练完成后，快速测试：

```python
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

# 加载模型
base_model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-3B-Instruct")
model = PeftModel.from_pretrained(base_model, "css_assistant_model")
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-3B-Instruct")

# 测试
prompt = "生成一个居中的红色文字的 CSS 类"
text = f"<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n"
inputs = tokenizer(text, return_tensors="pt")
outputs = model.generate(**inputs, max_length=200)
print(tokenizer.decode(outputs[0]))
```

---

## ⚠️ 常见问题

### 训练中断了？
```bash
# 检查是否有 checkpoint
ls css_assistant_model/checkpoint-*

# 如果有，可以恢复（需要修改脚本）
# 如果没有，重新运行
./scripts/resume_training.sh
```

### 内存不足？
编辑 `simple_train.py`，修改：
```python
BATCH_SIZE = 2  # 改小
GRADIENT_ACCUMULATION_STEPS = 8  # 改大
```

### 速度太慢？
- 使用 GPU（如果有）
- 减小数据集大小
- 使用云端 GPU（Colab）

---

## 📚 更多文档

- [完整 README](../README.md)
- [训练状态文档](TRAINING_STATUS.md)
- [详细训练指南](README_TRAINING.md)

---

**开始训练吧！** 🚀
