# CSS 助手模型微调项目

> 基于 Qwen2.5-3B-Instruct 微调的 CSS 代码生成助手

## 📋 目录

- [项目简介](#项目简介)
- [快速开始](#快速开始)
- [目录结构](#目录结构)
- [使用指南](#使用指南)
- [脚本说明](#脚本说明)
- [常见问题](#常见问题)

---

## 📖 项目简介

本项目使用 **LoRA (Low-Rank Adaptation)** 技术对 Qwen2.5-3B-Instruct 模型进行微调，训练一个专门用于生成 CSS 代码的助手。

### 核心特性

- ✅ **轻量级微调**: 使用 LoRA 技术，仅训练 0.48% 的参数
- ✅ **高质量数据**: 10,406 条精心处理的训练样本
- ✅ **易于使用**: 提供完整的自动化脚本
- ✅ **可恢复训练**: 支持训练中断后恢复
- ✅ **详细文档**: 完整的使用说明和故障排除指南

### 技术栈

- **基座模型**: Qwen/Qwen2.5-3B-Instruct (3.09B 参数)
- **微调方法**: LoRA (r=8, alpha=16)
- **框架**: Transformers + PEFT + Datasets
- **硬件**: 支持 CPU/MPS/CUDA

---

## 🚀 快速开始

### 环境要求

- Python 3.10 或 3.11
- 8GB+ 内存（推荐 16GB+）
- 10GB+ 磁盘空间

### 一键启动训练

```bash
cd /Users/songyanchao/Desktop/thing/zhishi/finetune
./scripts/setup_and_train.sh
```

这个脚本会自动：
1. 检查 Python 环境
2. 创建虚拟环境
3. 安装依赖包
4. 开始训练

### 训练时间

- **M1/M2 Mac (32GB)**: 约 2-4 小时
- **CPU**: 约 6-12 小时
- **GPU (CUDA)**: 约 1-2 小时

---

## 📁 目录结构

```
finetune/
├── README.md                    # 本文件 - 项目总览
├── docs/                        # 📚 文档目录
│   ├── TRAINING_STATUS.md      # 训练状态和详细说明
│   └── README_TRAINING.md      # 训练指南（旧版）
├── scripts/                     # 🔧 脚本目录
│   ├── setup_and_train.sh      # 一键安装和训练
│   ├── monitor_training.sh     # 监控训练进度
│   ├── pause_training.sh       # 暂停训练
│   ├── resume_training.sh      # 恢复训练
│   └── start_training.sh       # 启动训练（旧版）
├── simple_train.py              # 🎯 主训练脚本
├── process_data.py              # 📊 数据处理脚本
├── check_data_quality.py        # ✅ 数据质量检查
├── training_data.json           # 📦 训练数据 (10,406 条)
├── css_classes.json             # 🎨 CSS 类定义
├── train_config.yaml            # ⚙️ 训练配置（LLaMA-Factory）
├── train_cli.py                 # 💻 命令行训练（LLaMA-Factory）
├── finetune_css.py              # 🔧 微调脚本（旧版）
├── train_env/                   # 🐍 Python 虚拟环境
├── css_assistant_model/         # 💾 训练输出目录
│   ├── checkpoint-*/           # 训练检查点
│   ├── adapter_model.safetensors # LoRA 权重
│   └── adapter_config.json     # LoRA 配置
└── LLaMA-Factory/              # 🏭 LLaMA-Factory 框架（可选）
```

### 目录说明

#### 📚 `docs/` - 文档目录
存放所有项目文档和说明文件

#### 🔧 `scripts/` - 脚本目录
所有可执行的 Shell 脚本，用于训练管理

#### 💾 `css_assistant_model/` - 模型输出
训练完成后的模型文件和检查点

#### 🐍 虚拟环境目录（已忽略）
- `train_env/` - 训练环境
- `llama_env/` - LLaMA-Factory 环境
- `venv/` - 其他虚拟环境

---

## 📖 使用指南

### 1. 数据准备

#### 查看数据质量
```bash
python check_data_quality.py
```

#### 重新处理数据
```bash
python process_data.py
```

### 2. 训练模型

#### 方式一：自动化训练（推荐）
```bash
./scripts/setup_and_train.sh
```

#### 方式二：手动训练
```bash
# 创建虚拟环境
python3.11 -m venv train_env
source train_env/bin/activate

# 安装依赖
pip install torch transformers peft datasets accelerate

# 开始训练
python simple_train.py
```

### 3. 训练管理

#### 监控训练
```bash
./scripts/monitor_training.sh
```

输出示例：
```
✓ 训练进程正在运行
进程信息:
  PID: 12345
  CPU: 97.3%
  内存: 0.5%
  运行时间: 2:03.04
```

#### 暂停训练
```bash
./scripts/pause_training.sh
```

#### 恢复训练
```bash
./scripts/resume_training.sh
```

#### 查看日志
```bash
# 实时查看
tail -f training.log

# 查看最后 50 行
tail -50 training.log

# 搜索错误
grep -i error training.log
```

### 4. 使用模型

#### 加载模型
```python
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

# 加载基座模型
base_model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-3B-Instruct",
    device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-3B-Instruct")

# 加载 LoRA 权重
model = PeftModel.from_pretrained(base_model, "css_assistant_model")
model.eval()
```

#### 生成 CSS
```python
def generate_css(prompt):
    # 格式化输入
    text = f"<|im_start|>system\n你是一个专业的 CSS 助手。<|im_end|>\n<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n"
    
    # 分词
    inputs = tokenizer(text, return_tensors="pt").to(model.device)
    
    # 生成
    outputs = model.generate(
        **inputs,
        max_length=512,
        temperature=0.7,
        top_p=0.9,
        do_sample=True
    )
    
    # 解码
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return result

# 测试
prompt = "生成一个居中的红色文字的 CSS 类"
print(generate_css(prompt))
```

---

## 🔧 脚本说明

### `scripts/setup_and_train.sh`
**一键安装和训练脚本**

功能：
- 检查 Python 环境
- 创建虚拟环境
- 安装依赖包
- 启动训练

使用：
```bash
./scripts/setup_and_train.sh
```

### `scripts/monitor_training.sh`
**训练监控脚本**

功能：
- 显示训练进程状态
- 显示 CPU/内存使用
- 列出已保存的 checkpoints

使用：
```bash
./scripts/monitor_training.sh
```

### `scripts/pause_training.sh`
**暂停训练脚本**

功能：
- 安全停止训练进程
- 显示已保存的 checkpoints
- 提供恢复训练指引

使用：
```bash
./scripts/pause_training.sh
```

### `scripts/resume_training.sh`
**恢复训练脚本**

功能：
- 检查是否有 checkpoint
- 在后台启动训练
- 日志输出到 `training.log`

使用：
```bash
./scripts/resume_training.sh
```

---

## ❓ 常见问题

### Q1: 训练需要多长时间？
**A**: 取决于硬件配置：
- M1/M2 Mac (32GB): 2-4 小时
- CPU: 6-12 小时
- GPU (CUDA): 1-2 小时

### Q2: 训练中断了怎么办？
**A**: 
1. 检查是否有保存的 checkpoint：`ls css_assistant_model/checkpoint-*`
2. 如果有 checkpoint，可以修改 `simple_train.py` 添加恢复功能
3. 如果没有，需要从头开始训练

### Q3: 内存不足怎么办？
**A**: 修改 `simple_train.py` 中的参数：
```python
BATCH_SIZE = 2  # 减小批次大小
GRADIENT_ACCUMULATION_STEPS = 8  # 增加梯度累积
MAX_LENGTH = 256  # 减小最大序列长度
```

### Q4: 如何修改训练参数？
**A**: 编辑 `simple_train.py` 文件，修改以下参数：
```python
# LoRA 配置
LORA_R = 8  # LoRA 秩
LORA_ALPHA = 16  # LoRA alpha
LORA_DROPOUT = 0.05  # Dropout

# 训练配置
BATCH_SIZE = 4  # 批次大小
GRADIENT_ACCUMULATION_STEPS = 4  # 梯度累积
LEARNING_RATE = 2e-4  # 学习率
NUM_EPOCHS = 3  # 训练轮数
```

### Q5: 训练完成后如何使用模型？
**A**: 参考 [使用指南 - 使用模型](#4-使用模型) 部分

### Q6: 可以在云端训练吗？
**A**: 可以！推荐平台：
- Google Colab (免费 GPU)
- AWS SageMaker
- 阿里云 PAI
- 腾讯云 TI-ONE

### Q7: 如何评估模型效果？
**A**: 
1. 使用测试集评估
2. 人工评估生成的 CSS 代码
3. 对比微调前后的效果

---

## 📊 训练数据说明

### 数据统计
- **总样本数**: 10,406 条
- **正样本**: 9,585 条 (92.1%)
- **负样本**: 821 条 (7.9%)

### 数据格式
```json
{
  "instruction": "生成一个居中的红色文字的 CSS 类",
  "input": "",
  "output": ".centered-red-text {\n  text-align: center;\n  color: red;\n}"
}
```

### 数据来源
- CSS 类定义 (`css_classes.json`)
- 数据增强和变换
- 负样本生成

---

## 🔗 相关资源

### 文档
- [训练状态文档](docs/TRAINING_STATUS.md)
- [训练指南](docs/README_TRAINING.md)

### 模型
- [Qwen2.5-3B-Instruct](https://huggingface.co/Qwen/Qwen2.5-3B-Instruct)

### 框架
- [Transformers](https://github.com/huggingface/transformers)
- [PEFT](https://github.com/huggingface/peft)
- [LLaMA-Factory](https://github.com/hiyouga/LLaMA-Factory)

---

## 📝 更新日志

### 2025-11-11
- ✅ 创建项目结构
- ✅ 整理脚本到 `scripts/` 目录
- ✅ 整理文档到 `docs/` 目录
- ✅ 创建详细的 README 文档
- ✅ 添加训练管理脚本

---

## 📄 许可证

本项目仅供学习和研究使用。

---

## 🤝 贡献

欢迎提出问题和建议！

---

**祝您训练顺利！** 🎉
