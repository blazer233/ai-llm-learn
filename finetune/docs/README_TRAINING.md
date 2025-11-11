# CSS 类名助手 - 微调指南

## 📋 准备工作已完成

✅ LLaMA-Factory 已安装  
✅ 训练数据已准备 (10,406 条)  
✅ 配置文件已创建  
✅ 虚拟环境已配置  

---

## 🚀 开始微调（两种方式）

### 方式 1：Web UI（推荐，零代码）

```bash
cd /Users/songyanchao/Desktop/thing/zhishi/finetune/LLaMA-Factory
source ../llama_env/bin/activate
python3 src/webui.py
```

然后浏览器打开 `http://127.0.0.1:7860`

**Web UI 操作步骤**：
1. **模型名称**: 输入 `Qwen/Qwen2.5-3B-Instruct`
2. **数据集**: 选择 `css_assistant`
3. **微调方法**: 选择 `LoRA`
4. **LoRA 秩**: 设置为 `8`
5. **学习率**: 设置为 `5e-5`
6. **训练轮数**: 设置为 `3`
7. **批次大小**: 设置为 `2`
8. 点击 **开始训练**

---

### 方式 2：命令行（自动化）

```bash
cd /Users/songyanchao/Desktop/thing/zhishi/finetune
source llama_env/bin/activate
python3 train_cli.py
```

---

## ⏱️ 预计训练时间

- **M1 Pro (32GB)**: 约 2-4 小时
- **数据量**: 10,406 条
- **训练轮数**: 3 epochs
- **显存占用**: 约 8-12GB

---

## 📊 训练过程监控

训练过程中会显示：
- ✅ Loss（损失值）- 越低越好
- ✅ Learning Rate（学习率）
- ✅ Steps/Second（训练速度）
- ✅ ETA（预计剩余时间）

**正常现象**：
- Loss 从 2-3 逐渐降到 0.5 以下
- 前几百步可能较慢（模型下载和初始化）

---

## 💾 训练完成后

模型保存在：
```
/Users/songyanchao/Desktop/thing/zhishi/finetune/output_model/
```

包含文件：
- `adapter_config.json` - LoRA 配置
- `adapter_model.safetensors` - LoRA 权重
- `tokenizer_config.json` - 分词器配置
- `training_args.bin` - 训练参数

---

## 🧪 测试微调后的模型

### 方法 1：使用 LLaMA-Factory 的 Chat UI

```bash
cd /Users/songyanchao/Desktop/thing/zhishi/finetune/LLaMA-Factory
source ../llama_env/bin/activate
python3 src/webui.py
```

在 Web UI 中：
1. 切换到 **Chat** 标签页
2. 加载基座模型：`Qwen/Qwen2.5-3B-Instruct`
3. 加载 LoRA 适配器：选择你的输出目录
4. 开始对话测试

### 方法 2：Python 脚本测试

创建测试脚本 `test_model.py`：

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

# 加载基座模型
base_model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-3B-Instruct",
    trust_remote_code=True,
    device_map="auto"
)

# 加载 LoRA 适配器
model = PeftModel.from_pretrained(
    base_model,
    "/Users/songyanchao/Desktop/thing/zhishi/finetune/output_model"
)

# 加载分词器
tokenizer = AutoTokenizer.from_pretrained(
    "Qwen/Qwen2.5-3B-Instruct",
    trust_remote_code=True
)

# 测试
def chat(query):
    messages = [{"role": "user", "content": query}]
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )
    inputs = tokenizer([text], return_tensors="pt").to(model.device)
    outputs = model.generate(**inputs, max_new_tokens=128)
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return response.split("assistant\n")[-1]

# 测试用例
print("测试 1:", chat("我需要一个红色背景"))
print("测试 2:", chat("设置圆角"))
print("测试 3:", chat("生成一个透明背景的div"))
```

---

## 🎯 预期效果

训练成功后，模型应该能够：

✅ **输入**: "我需要一个红色背景"  
✅ **输出**: `bg-red`

✅ **输入**: "设置圆角"  
✅ **输出**: `radius-xxx`

✅ **输入**: "生成一个透明背景的div"  
✅ **输出**: `<div className="bg-c-transparent">内容</div>`

✅ **输入**: "今天天气怎么样？"  
✅ **输出**: "抱歉，我是CSS类名助手，只能回答CSS相关的问题..."

---

## ❓ 常见问题

### Q1: 显存不足怎么办？
**A**: 减小批次大小：
```yaml
per_device_train_batch_size: 1  # 从 2 改为 1
gradient_accumulation_steps: 8  # 从 4 改为 8
```

### Q2: 训练太慢怎么办？
**A**: 减少数据量或训练轮数：
```yaml
max_samples: 5000  # 只用一半数据
num_train_epochs: 2  # 从 3 改为 2
```

### Q3: 如何继续训练？
**A**: 设置 `resume_from_checkpoint`:
```yaml
resume_from_checkpoint: /path/to/checkpoint-500
```

### Q4: 如何部署模型？
**A**: 合并 LoRA 权重到基座模型：
```bash
python3 src/export_model.py \
    --model_name_or_path Qwen/Qwen2.5-3B-Instruct \
    --adapter_name_or_path ./output_model \
    --export_dir ./merged_model \
    --export_size 2
```

---

## 📞 需要帮助？

如果遇到问题，请检查：
1. 虚拟环境是否激活
2. 数据文件是否存在
3. 显存是否充足
4. 网络是否正常（首次需要下载模型）

---

## 🎉 下一步

训练完成后，你可以：
1. 部署为 API 服务
2. 集成到 VSCode 插件
3. 继续微调优化
4. 尝试更大的模型（7B）

祝训练顺利！🚀
