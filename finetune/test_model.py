#!/usr/bin/env python3
"""
CSS 助手模型测试脚本
使用训练好的 LoRA 模型生成 CSS 代码
"""

from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import torch

# 配置
BASE_MODEL = "Qwen/Qwen2.5-1.5B-Instruct"
ADAPTER_PATH = "./css_assistant_model"

print("=" * 60)
print("CSS 助手模型测试")
print("=" * 60)
print("\n[1/2] 加载模型中...")

# 加载基座模型
base_model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    device_map="auto",
    torch_dtype=torch.float16,
    trust_remote_code=True
)

# 加载分词器
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)

# 加载 LoRA 权重
model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
model.eval()

print("✓ 模型加载完成")
print(f"  基座模型: {BASE_MODEL}")
print(f"  LoRA 权重: {ADAPTER_PATH}")

def generate_css(prompt, max_length=512, temperature=0.7, top_p=0.9):
    """
    生成 CSS 代码
    
    参数:
        prompt: 用户提示词
        max_length: 最大生成长度
        temperature: 温度参数 (0.1-1.0, 越低越确定)
        top_p: nucleus sampling 参数
    """
    # 格式化为 Qwen 对话格式
    text = f"<|im_start|>system\n你是一个专业的 CSS 助手。<|im_end|>\n<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n"
    
    # 分词
    inputs = tokenizer(text, return_tensors="pt").to(model.device)
    
    # 生成
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=max_length,
            temperature=temperature,
            top_p=top_p,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    # 解码
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # 提取 assistant 回复部分
    if "<|im_start|>assistant\n" in result:
        return result.split("<|im_start|>assistant\n")[-1].strip()
    return result

print("\n[2/2] 运行测试用例...")
print("=" * 60)

# 测试用例
test_prompts = [
    "生成一个居中的红色文字的 CSS 类",
    "创建一个圆角边框的按钮样式",
    "写一个响应式垂直居中的布局",
]

for i, prompt in enumerate(test_prompts, 1):
    print(f"\n[测试 {i}/{len(test_prompts)}] {prompt}")
    print("-" * 60)
    
    try:
        result = generate_css(prompt, temperature=0.7)
        print(result)
    except Exception as e:
        print(f"❌ 生成失败: {e}")
    
    print()

print("=" * 60)
print("✓ 测试完成")
print("\n💡 使用提示:")
print("  - 修改 test_prompts 列表添加自己的测试用例")
print("  - 调整 temperature (0.1-1.0) 控制生成随机性")
print("  - 调整 max_length 控制生成长度")
print("=" * 60)

# 交互模式
print("\n进入交互模式（输入 'quit' 退出）:")
print("-" * 60)

while True:
    try:
        user_input = input("\n请输入提示词: ").strip()
        
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("再见！")
            break
        
        if not user_input:
            continue
        
        print("\n生成中...")
        result = generate_css(user_input, temperature=0.7)
        print("-" * 60)
        print(result)
        print("-" * 60)
        
    except KeyboardInterrupt:
        print("\n\n再见！")
        break
    except Exception as e:
        print(f"❌ 错误: {e}")
