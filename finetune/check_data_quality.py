import json
from collections import Counter

with open("training_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print("=" * 60)
print("🔍 数据质量检查报告")
print("=" * 60)

# 1. 基本统计
print(f"\n📊 基本统计:")
print(f"  总样本数: {len(data)}")

# 2. 长度分析
inst_lengths = [len(item["instruction"]) for item in data]
out_lengths = [len(item["output"]) for item in data]

print(f"\n📏 长度分析:")
print(
    f"  问题长度 - 最短: {min(inst_lengths)}, 最长: {max(inst_lengths)}, 平均: {sum(inst_lengths)/len(inst_lengths):.1f}"
)
print(
    f"  答案长度 - 最短: {min(out_lengths)}, 最长: {max(out_lengths)}, 平均: {sum(out_lengths)/len(out_lengths):.1f}"
)

# 3. 空值检查
empty_inst = sum(1 for item in data if not item["instruction"].strip())
empty_out = sum(1 for item in data if not item["output"].strip())

print(f"\n✓ 完整性检查:")
print(f"  空问题: {empty_inst}")
print(f"  空答案: {empty_out}")

# 4. 重复检查
inst_counter = Counter(item["instruction"] for item in data)
duplicates = sum(1 for count in inst_counter.values() if count > 1)

print(f"\n🔄 重复性检查:")
print(f"  重复问题数: {duplicates}")
if duplicates > 0:
    print(f"  最常见的问题:")
    for inst, count in inst_counter.most_common(3):
        if count > 1:
            print(f"    '{inst[:50]}...' 出现 {count} 次")

# 5. 类名覆盖率
classnames_in_output = set()
for item in data:
    # 提取输出中的类名
    import re

    matches = re.findall(r"\b[\w-]+\b", item["output"])
    classnames_in_output.update(matches)

print(f"\n📦 类名覆盖:")
print(f"  输出中包含的唯一类名数: {len(classnames_in_output)}")

# 6. 负样本比例
negative_count = sum(
    1 for item in data if "抱歉" in item["output"] or "只能回答" in item["output"]
)
negative_ratio = (negative_count / len(data)) * 100

print(f"\n⚖️ 样本平衡:")
print(f"  负样本数: {negative_count} ({negative_ratio:.1f}%)")
print(f"  建议负样本比例: 5-10%")

if negative_ratio < 5:
    print(f"  ⚠️ 警告: 负样本过少，建议增加")
elif negative_ratio > 15:
    print(f"  ⚠️ 警告: 负样本过多，可能影响正常功能")
else:
    print(f"  ✅ 负样本比例合理")

# 7. 输出格式检查
code_samples = sum(
    1 for item in data if "<div" in item["output"] or "className" in item["output"]
)
print(f"\n💻 代码生成样本: {code_samples} ({(code_samples/len(data)*100):.1f}%)")

print("\n" + "=" * 60)
