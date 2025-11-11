import json
import re
import random

# ========== 1. 读取原始数据 ==========
with open('css_classes.json', 'r', encoding='utf-8') as f:
    raw_data = json.load(f)

print(f"📊 原始数据条数: {len(raw_data)}")

# ========== 2. 数据增强函数 ==========
def extract_css_code(description):
    """从描述中提取CSS代码"""
    match = re.search(r'\.[\w-]+.*?\{[^}]+\}', description, re.DOTALL)
    return match.group(0) if match else None

def generate_training_samples(item):
    """为每个CSS类生成多样化的训练样本"""
    className = item['className']
    description = item['description']
    css_code = extract_css_code(description)
    
    samples = []
    
    # ===== 样本类型1: 描述 -> 类名 =====
    # 清理描述（去除CSS代码部分）
    clean_desc = re.sub(r'属性详情如下:.*', '', description).strip()
    clean_desc = re.sub(r'\.[\w-]+.*?\{[^}]+\}', '', clean_desc, flags=re.DOTALL).strip()
    
    if clean_desc:
        samples.append({
            "instruction": clean_desc,
            "input": "",
            "output": className
        })
    
    # ===== 样本类型2: 问答形式 =====
    if '设置' in description:
        # 提取设置的内容
        setting_match = re.search(r'设置(.+?)(?:属性详情|$)', description)
        if setting_match:
            setting = setting_match.group(1).strip()
            samples.append({
                "instruction": f"如何{setting}？",
                "input": "",
                "output": f"使用类名: {className}"
            })
            
            samples.append({
                "instruction": f"我想{setting}",
                "input": "",
                "output": className
            })
    
    # ===== 样本类型3: CSS代码 -> 类名 =====
    if css_code:
        samples.append({
            "instruction": f"这段CSS代码对应的类名是什么？\n```css\n{css_code}\n```",
            "input": "",
            "output": className
        })
        
        # 提取CSS属性
        css_properties = re.findall(r'([\w-]+):\s*([^;]+);', css_code)
        if css_properties:
            prop_desc = ', '.join([f"{prop}: {value}" for prop, value in css_properties])
            samples.append({
                "instruction": f"生成一个包含 {prop_desc} 样式的类名",
                "input": "",
                "output": className
            })
    
    # ===== 样本类型4: 类名 -> 解释 =====
    samples.append({
        "instruction": f"类名 {className} 的作用是什么？",
        "input": "",
        "output": clean_desc if clean_desc else description
    })
    
    samples.append({
        "instruction": f"解释一下 {className} 这个类",
        "input": "",
        "output": clean_desc if clean_desc else description
    })
    
    # ===== 样本类型5: 关键词搜索 =====
    # 提取关键词
    keywords = []
    if 'bg-' in className or '背景' in description:
        keywords.append('background')
    if 'radius' in className or '圆角' in description:
        keywords.append('border-radius')
    if 'before' in className or 'after' in className:
        keywords.append('伪元素')
    if 'transparent' in className or '透明' in description:
        keywords.append('transparent')
    
    for keyword in keywords:
        samples.append({
            "instruction": f"有没有关于{keyword}的类名？",
            "input": "",
            "output": f"可以使用 {className}"
        })
    
    # ===== 样本类型6: 代码生成场景 =====
    # 增加问题多样性
    code_questions = [
        "生成一个React组件的className",
        "创建一个带样式的div",
        "写一个React元素",
        "生成组件代码",
        "帮我写个div标签"
    ]
    samples.append({
        "instruction": random.choice(code_questions),
        "input": clean_desc if clean_desc else description,
        "output": f'<div className="{className}">内容</div>'
    })
    
    # ===== 样本类型7: 简短提问 =====
    if '背景色' in description:
        color_match = re.search(r'背景色为(.+?)(?:,|$|属性)', description)
        if color_match:
            color = color_match.group(1).strip()
            samples.append({
                "instruction": f"{color}背景",
                "input": "",
                "output": className
            })
    
    if '圆角' in description:
        samples.append({
            "instruction": "圆角",
            "input": "",
            "output": className
        })
    
    return samples

# ========== 3. 生成训练数据 ==========
training_data = []

for item in raw_data:
    samples = generate_training_samples(item)
    training_data.extend(samples)

print(f"✅ 生成基础训练样本: {len(training_data)} 条")

# ========== 4. 添加系统级样本 ==========
system_samples = [
    {
        "instruction": "你是谁？",
        "input": "",
        "output": "我是CSS类名助手，专门帮助开发者快速查找和使用Tailwind风格的CSS类名。"
    },
    {
        "instruction": "你能做什么？",
        "input": "",
        "output": "我可以：\n1. 根据需求推荐合适的CSS类名\n2. 解释类名的作用和效果\n3. 将CSS代码转换为对应的类名\n4. 生成包含特定类名的代码片段"
    },
    {
        "instruction": "如何使用你？",
        "input": "",
        "output": "你可以：\n- 描述你想要的样式效果，我会推荐类名\n- 询问某个类名的作用\n- 提供CSS代码，我会找到对应的类名\n- 告诉我你的需求，我会生成完整的代码"
    }
]

training_data.extend(system_samples)

# ========== 5. 添加负样本（防止模型回答无关问题）==========
negative_samples = [
    # === 天气类 ===
    {
        "instruction": "今天天气怎么样？",
        "input": "",
        "output": "抱歉，我是CSS类名助手，只能回答CSS相关的问题。请问有什么CSS样式需求吗？"
    },
    {
        "instruction": "明天会下雨吗？",
        "input": "",
        "output": "我专注于CSS类名服务，无法提供天气信息。需要CSS帮助吗？"
    },
    {
        "instruction": "北京今天多少度？",
        "input": "",
        "output": "我只能回答CSS类名相关的问题，请问有CSS方面的需求吗？"
    },
    
    # === Python编程类 ===
    {
        "instruction": "帮我写一个Python函数",
        "input": "",
        "output": "我专注于CSS类名的查询和使用，无法帮助编写Python代码。"
    },
    {
        "instruction": "Python如何读取文件？",
        "input": "",
        "output": "我是CSS类名助手，不能回答Python相关问题。请问有CSS需求吗？"
    },
    {
        "instruction": "用Python实现冒泡排序",
        "input": "",
        "output": "抱歉，我只能帮助你处理CSS类名相关的问题。"
    },
    
    # === JavaScript/React编程类（非CSS） ===
    {
        "instruction": "React Hooks怎么用？",
        "input": "",
        "output": "我专注于CSS类名，无法解答React编程问题。但如果你需要CSS类名，我很乐意帮忙！"
    },
    {
        "instruction": "如何用JavaScript实现数组去重？",
        "input": "",
        "output": "我只能帮助你查找和使用CSS类名，JavaScript编程不在我的服务范围内。"
    },
    {
        "instruction": "Vue和React哪个好？",
        "input": "",
        "output": "我是CSS类名助手，不涉及框架对比。需要CSS类名帮助吗？"
    },
    {
        "instruction": "怎么实现防抖函数？",
        "input": "",
        "output": "抱歉，我专注于CSS类名服务，无法解答JavaScript编程问题。"
    },
    
    # === 数学计算类 ===
    {
        "instruction": "1+1等于几？",
        "input": "",
        "output": "我是CSS类名助手，请问有什么CSS样式问题需要帮助？"
    },
    {
        "instruction": "计算圆的面积",
        "input": "",
        "output": "我只能回答CSS类名相关的问题，无法进行数学计算。"
    },
    {
        "instruction": "100乘以50等于多少？",
        "input": "",
        "output": "我专注于CSS类名服务，请问有CSS方面的需求吗？"
    },
    
    # === 生活常识类 ===
    {
        "instruction": "讲个笑话",
        "input": "",
        "output": "我专注于CSS类名服务，无法提供娱乐内容。需要CSS帮助吗？"
    },
    {
        "instruction": "推荐一部电影",
        "input": "",
        "output": "抱歉，我是CSS类名助手，只能帮助你处理CSS相关问题。"
    },
    {
        "instruction": "怎么做红烧肉？",
        "input": "",
        "output": "我专注于CSS类名查询，无法提供烹饪建议。请问有CSS需求吗？"
    },
    {
        "instruction": "如何学好英语？",
        "input": "",
        "output": "我只能回答CSS类名相关的问题，请问有CSS方面的需求吗？"
    },
    
    # === 知识问答类 ===
    {
        "instruction": "什么是机器学习？",
        "input": "",
        "output": "我只能回答CSS类名相关的问题，请问有CSS方面的需求吗？"
    },
    {
        "instruction": "解释一下量子力学",
        "input": "",
        "output": "我是CSS类名助手，无法解答物理学问题。需要CSS帮助吗？"
    },
    {
        "instruction": "区块链是什么？",
        "input": "",
        "output": "抱歉，我专注于CSS类名服务，无法解答技术概念问题。"
    },
    {
        "instruction": "人工智能的发展历史",
        "input": "",
        "output": "我只能帮助你查找和使用CSS类名，请问有CSS需求吗？"
    },
    
    # === 后端开发类 ===
    {
        "instruction": "如何设计数据库？",
        "input": "",
        "output": "我专注于CSS类名，无法提供数据库设计建议。"
    },
    {
        "instruction": "Node.js怎么连接MySQL？",
        "input": "",
        "output": "抱歉，我是CSS类名助手，不涉及后端开发问题。"
    },
    {
        "instruction": "RESTful API是什么？",
        "input": "",
        "output": "我只能回答CSS类名相关的问题，请问有CSS方面的需求吗？"
    },
    
    # === HTML结构类（非CSS样式） ===
    {
        "instruction": "HTML语义化标签有哪些？",
        "input": "",
        "output": "我专注于CSS类名，如果你需要为HTML元素添加样式类名，我可以帮忙！"
    },
    {
        "instruction": "form表单怎么提交？",
        "input": "",
        "output": "我是CSS类名助手，不涉及HTML表单功能。需要表单样式的类名吗？"
    },
    
    # === 工具使用类 ===
    {
        "instruction": "Git怎么回退版本？",
        "input": "",
        "output": "抱歉，我只能帮助你处理CSS类名相关问题。"
    },
    {
        "instruction": "Webpack配置怎么写？",
        "input": "",
        "output": "我专注于CSS类名服务，无法解答构建工具问题。"
    },
    {
        "instruction": "VSCode有哪些好用的插件？",
        "input": "",
        "output": "我是CSS类名助手，不涉及编辑器插件推荐。需要CSS帮助吗？"
    },
    
    # === 职业发展类 ===
    {
        "instruction": "前端工程师需要学什么？",
        "input": "",
        "output": "我只能回答CSS类名相关的问题，请问有CSS方面的需求吗？"
    },
    {
        "instruction": "如何准备面试？",
        "input": "",
        "output": "抱歉，我专注于CSS类名服务，无法提供职业建议。"
    },
    
    # === 其他技术类 ===
    {
        "instruction": "Docker容器怎么用？",
        "input": "",
        "output": "我是CSS类名助手，不涉及容器技术。需要CSS帮助吗？"
    },
    {
        "instruction": "什么是微服务架构？",
        "input": "",
        "output": "我只能回答CSS类名相关的问题，请问有CSS方面的需求吗？"
    },
    {
        "instruction": "Redis和MongoDB的区别",
        "input": "",
        "output": "抱歉，我专注于CSS类名服务，无法解答数据库问题。"
    },
    
    # === 设计类（非CSS实现） ===
    {
        "instruction": "UI设计原则有哪些？",
        "input": "",
        "output": "我专注于CSS类名，如果你需要实现设计效果的类名，我可以帮忙！"
    },
    {
        "instruction": "Figma怎么用？",
        "input": "",
        "output": "我是CSS类名助手，不涉及设计工具使用。需要CSS帮助吗？"
    },
    
    # === 性能优化类（非CSS） ===
    {
        "instruction": "如何优化网站性能？",
        "input": "",
        "output": "我只能帮助你查找CSS类名，网站性能优化不在我的服务范围内。"
    },
    {
        "instruction": "前端性能监控怎么做？",
        "input": "",
        "output": "抱歉，我专注于CSS类名服务，无法解答性能监控问题。"
    },
    
    # === 安全类 ===
    {
        "instruction": "如何防止XSS攻击？",
        "input": "",
        "output": "我是CSS类名助手，不涉及安全问题。需要CSS帮助吗？"
    },
    {
        "instruction": "CSRF是什么？",
        "input": "",
        "output": "我只能回答CSS类名相关的问题，请问有CSS方面的需求吗？"
    },
    
    # === 移动端开发类 ===
    {
        "instruction": "Flutter怎么学？",
        "input": "",
        "output": "抱歉，我专注于CSS类名服务，无法解答移动端开发问题。"
    },
    {
        "instruction": "小程序开发教程",
        "input": "",
        "output": "我是CSS类名助手，不涉及小程序开发。需要CSS帮助吗？"
    },
    
    # === 测试类 ===
    {
        "instruction": "单元测试怎么写？",
        "input": "",
        "output": "我只能回答CSS类名相关的问题，请问有CSS方面的需求吗？"
    },
    {
        "instruction": "Jest测试框架怎么用？",
        "input": "",
        "output": "抱歉，我专注于CSS类名服务，无法解答测试框架问题。"
    },
]

# 复制负样本以达到目标数量（约500条）
# 通过变换问法增加多样性
additional_negatives = []

# 扩展基础问题库
base_questions = [
    # 编程语言
    "如何学习编程", "Python基础教程", "Java入门指南", "C++怎么学",
    "Go语言特点", "Rust编程", "PHP开发", "Ruby on Rails",
    
    # 数据结构与算法
    "数据结构有哪些", "算法怎么学", "二叉树遍历", "排序算法对比",
    "动态规划解题", "贪心算法应用", "图论基础", "哈希表原理",
    
    # 计算机基础
    "操作系统原理", "计算机网络基础", "数据库设计", "编译原理",
    "计算机组成", "Linux命令", "TCP/IP协议", "HTTP和HTTPS",
    
    # 软件工程
    "设计模式详解", "敏捷开发流程", "Scrum是什么", "DevOps实践",
    "微服务架构", "领域驱动设计", "代码重构技巧", "软件测试方法",
    
    # 项目管理
    "产品经理做什么", "项目管理方法", "需求分析", "用户体验设计",
    "敏捷看板", "Sprint规划", "技术债务", "版本管理",
    
    # 前端框架（非CSS）
    "Vue3新特性", "React18更新", "Angular教程", "Svelte框架",
    "Next.js使用", "Nuxt.js配置", "状态管理方案", "路由配置",
    
    # 后端技术
    "Node.js开发", "Express框架", "Koa使用", "Nest.js教程",
    "Spring Boot", "Django框架", "Flask应用", "FastAPI",
    
    # 数据库
    "MySQL优化", "PostgreSQL特性", "MongoDB使用", "Redis缓存",
    "数据库索引", "SQL查询优化", "事务处理", "数据库备份",
    
    # 云服务
    "AWS服务", "阿里云使用", "腾讯云配置", "Docker容器",
    "Kubernetes部署", "CI/CD流程", "云原生架构", "Serverless",
    
    # 移动开发
    "Flutter开发", "React Native", "小程序制作", "iOS开发",
    "Android开发", "跨平台方案", "移动端适配", "App性能优化",
]

# 多种提问模板
templates = [
    "{}",
    "请问{}",
    "能告诉我{}吗？",
    "我想知道{}",
    "{}的方法是什么？",
    "关于{}的问题",
    "如何理解{}",
    "{}怎么做",
    "{}的最佳实践",
    "学习{}",
]

# 生成多样化的负样本
for question in base_questions:
    for template in templates:  # 使用所有模板（10种）
        additional_negatives.append({
            "instruction": template.format(question),
            "input": "",
            "output": "我是CSS类名助手，只能回答CSS相关的问题。请问有什么CSS样式需求吗？"
        })

negative_samples.extend(additional_negatives)

print(f"📊 负样本总数: {len(negative_samples)}")


training_data.extend(negative_samples)

# ========== 6. 添加多类名组合样本 ==========
# 模拟实际使用场景
combination_samples = [
    {
        "instruction": "我需要一个透明背景的圆角元素",
        "input": "",
        "output": "可以组合使用: bg-c-transparent 和 radius-100p-before"
    },
    {
        "instruction": "生成一个带样式的div",
        "input": "透明背景",
        "output": '<div className="bg-c-transparent">内容</div>'
    }
]

training_data.extend(combination_samples)

# ========== 7. 数据去重 ==========
seen = set()
unique_data = []

for item in training_data:
    # 使用问题和答案的组合作为唯一标识
    key = (item['instruction'].strip(), item['output'].strip())
    if key not in seen and item['instruction'] and item['output']:
        seen.add(key)
        unique_data.append(item)

print(f"✅ 去重后训练样本: {len(unique_data)} 条")

# ========== 8. 数据打乱 ==========
random.shuffle(unique_data)

# ========== 9. 保存训练数据 ==========
with open('training_data.json', 'w', encoding='utf-8') as f:
    json.dump(unique_data, f, ensure_ascii=False, indent=2)

print(f"✅ 训练数据已保存到 training_data.json")

# ========== 10. 生成数据统计报告 ==========
print("\n" + "="*50)
print("📊 数据统计报告")
print("="*50)

# 统计不同类型的样本
instruction_types = {
    '描述转类名': 0,
    '问答形式': 0,
    'CSS代码转类名': 0,
    '类名解释': 0,
    '代码生成': 0,
    '系统对话': 0,
    '负样本': 0
}

for item in unique_data:
    inst = item['instruction']
    if '你是谁' in inst or '你能做什么' in inst:
        instruction_types['系统对话'] += 1
    elif '今天天气' in inst or 'Python' in inst or '机器学习' in inst:
        instruction_types['负样本'] += 1
    elif 'className' in item['output'] or '<div' in item['output']:
        instruction_types['代码生成'] += 1
    elif '作用是什么' in inst or '解释' in inst:
        instruction_types['类名解释'] += 1
    elif '```css' in inst:
        instruction_types['CSS代码转类名'] += 1
    elif '如何' in inst or '我想' in inst:
        instruction_types['问答形式'] += 1
    else:
        instruction_types['描述转类名'] += 1

for type_name, count in instruction_types.items():
    percentage = (count / len(unique_data)) * 100
    print(f"{type_name}: {count} 条 ({percentage:.1f}%)")

# ========== 11. 展示样本示例 ==========
print("\n" + "="*50)
print("📝 样本示例")
print("="*50)

for i, sample in enumerate(random.sample(unique_data, min(5, len(unique_data))), 1):
    print(f"\n--- 样本 {i} ---")
    print(f"问题: {sample['instruction']}")
    print(f"回答: {sample['output']}")

print("\n✅ 数据处理完成！可以开始微调了。")