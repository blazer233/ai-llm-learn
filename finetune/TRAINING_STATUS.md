# CSS 助手模型微调 - 训练状态

## 📊 当前状态

**训练已启动！** ✅

- **开始时间**: 2025-11-11 10:31 AM
- **训练进程**: 正在运行
- **基座模型**: Qwen/Qwen2.5-3B-Instruct (3.09B 参数)
- **微调方法**: LoRA (QLoRA)
- **可训练参数**: 14,966,784 (0.48%)

## 📈 训练配置

### 数据集
- **训练样本数**: 10,406 条
- **数据文件**: `training_data.json`
- **数据质量**: 
  - 正样本: 9,585 条 (92.1%)
  - 负样本: 821 条 (7.9%)

### 训练参数
- **批次大小**: 4
- **梯度累积步数**: 4
- **有效批次大小**: 16
- **学习率**: 2e-4
- **训练轮数**: 3
- **最大序列长度**: 512
- **优化器**: AdamW
- **学习率调度**: Cosine

### LoRA 配置
- **秩 (r)**: 8
- **Alpha**: 16
- **Dropout**: 0.05
- **目标模块**: q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj

## 🔍 监控训练

### 查看训练状态
```bash
cd /Users/songyanchao/Desktop/thing/zhishi/finetune
./monitor_training.sh
```

### 暂停训练
```bash
./pause_training.sh
```
**说明**: 
- 会发送中断信号安全停止训练
- 如果训练已保存 checkpoint，可以稍后恢复
- 如果未到保存点（500步），需要从头开始

### 恢复训练
```bash
./resume_training.sh
```
**说明**:
- 会在后台启动训练
- 日志保存到 `training.log`
- 使用 `tail -f training.log` 查看实时日志

### 查看训练日志
```bash
# 实时查看日志
tail -f training.log

# 查看最后 50 行
tail -50 training.log

# 搜索错误
grep -i error training.log
```

### 查看训练日志（前台运行时）
训练过程会实时显示：
- 训练步数
- 损失值 (Loss)
- 学习率
- 训练速度

### 检查 Checkpoints
模型会每 500 步保存一次 checkpoint：
```bash
ls -lh css_assistant_model/checkpoint-*
```

## 📁 输出文件

训练完成后，模型将保存在：
```
css_assistant_model/
├── adapter_config.json      # LoRA 配置
├── adapter_model.safetensors # LoRA 权重
├── tokenizer_config.json    # 分词器配置
├── tokenizer.json           # 分词器
└── checkpoint-*/            # 训练检查点
```

## ⏱️ 预计训练时间

- **总步数**: 1,953 步 (10,406 样本 ÷ 16 有效批次 × 3 轮)
- **预计时间**: 
  - M1 Pro (32GB): 约 2-4 小时
  - 具体时间取决于 CPU/GPU 性能

## 🎯 训练完成后

### 1. 测试模型
```python
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

# 加载基座模型
base_model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-3B-Instruct")
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-3B-Instruct")

# 加载 LoRA 权重
model = PeftModel.from_pretrained(base_model, "css_assistant_model")

# 测试
prompt = "生成一个居中的红色文字的 CSS 类"
inputs = tokenizer(prompt, return_tensors="pt")
outputs = model.generate(**inputs, max_length=100)
print(tokenizer.decode(outputs[0]))
```

### 2. 合并模型（可选）
```python
# 将 LoRA 权重合并到基座模型
merged_model = model.merge_and_unload()
merged_model.save_pretrained("css_assistant_merged")
```

### 3. 部署模型
- 使用 FastAPI/Flask 创建 API 服务
- 集成到现有项目中
- 部署到云服务器

## 📝 注意事项

1. **不要中断训练**: 训练过程中请保持电脑运行
2. **定期检查**: 使用 `monitor_training.sh` 查看进度
3. **磁盘空间**: 确保有足够空间保存 checkpoints（约 5-10GB）
4. **内存使用**: 训练会占用约 8-16GB 内存

## 🐛 故障排除

### 训练中断
如果训练意外中断，可以从最新的 checkpoint 恢复：
```bash
# 查找最新的 checkpoint
ls -lt css_assistant_model/checkpoint-* | head -1

# 修改训练脚本，添加 resume_from_checkpoint 参数
```

### 内存不足
如果遇到内存不足：
1. 减小批次大小（修改 `BATCH_SIZE`）
2. 增加梯度累积步数（修改 `GRADIENT_ACCUMULATION_STEPS`）
3. 减小最大序列长度（修改 `MAX_LENGTH`）

### 训练速度慢
- M1/M2 Mac 会使用 MPS 加速
- 如果太慢，考虑使用云 GPU（如 Colab, AWS, 阿里云）

## 📞 支持

如有问题，请检查：
1. 训练日志输出
2. `css_assistant_model/` 目录内容
3. 系统资源使用情况（内存、CPU）
