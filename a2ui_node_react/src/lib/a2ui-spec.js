/**
 * A2UI 0.8 规范定义
 * 基于 Google A2UI 标准 + TDesign 组件映射
 */

export const A2UI_STANDARD_CATALOG = {
  version: '0.8',
  components: {
    // 布局容器
    container: {
      type: 'container',
      description: '通用容器组件',
      props: ['direction', 'gap', 'padding', 'alignment']
    },
    space: {
      type: 'space',
      description: '间距布局组件',
      props: ['direction', 'size', 'align']
    },
    divider: {
      type: 'divider',
      description: '分割线',
      props: ['layout', 'dashed', 'text']
    },
    
    // 输入组件
    textInput: {
      type: 'textInput',
      description: '单行文本输入',
      props: ['label', 'placeholder', 'value', 'required', 'disabled', 'clearable', 'type']
    },
    textArea: {
      type: 'textArea',
      description: '多行文本输入',
      props: ['label', 'placeholder', 'value', 'rows', 'required', 'maxLength']
    },
    datePicker: {
      type: 'datePicker',
      description: '日期选择器',
      props: ['label', 'value', 'placeholder', 'required', 'clearable', 'disabled']
    },
    timePicker: {
      type: 'timePicker',
      description: '时间选择器',
      props: ['label', 'value', 'placeholder', 'required', 'clearable', 'disabled']
    },
    select: {
      type: 'select',
      description: '下拉选择',
      props: ['label', 'options', 'value', 'required', 'placeholder', 'clearable', 'disabled']
    },
    checkbox: {
      type: 'checkbox',
      description: '复选框',
      props: ['label', 'checked', 'disabled']
    },
    radio: {
      type: 'radio',
      description: '单选按钮',
      props: ['label', 'checked', 'disabled']
    },
    radioGroup: {
      type: 'radioGroup',
      description: '单选按钮组',
      props: ['label', 'value', 'options', 'required']
    },
    switch: {
      type: 'switch',
      description: '开关',
      props: ['label', 'checked', 'disabled']
    },
    slider: {
      type: 'slider',
      description: '滑块',
      props: ['label', 'value', 'min', 'max', 'step', 'disabled']
    },
    upload: {
      type: 'upload',
      description: '文件上传',
      props: ['label', 'theme', 'multiple', 'max', 'disabled', 'required']
    },
    
    // 展示组件
    text: {
      type: 'text',
      description: '文本显示',
      props: ['value', 'text', 'type', 'underline', 'mark', 'strong']
    },
    heading: {
      type: 'heading',
      description: '标题',
      props: ['level', 'text']
    },
    paragraph: {
      type: 'paragraph',
      description: '段落',
      props: ['text', 'ellipsis']
    },
    list: {
      type: 'list',
      description: '列表',
      props: ['items', 'split', 'stripe']
    },
    table: {
      type: 'table',
      description: '表格',
      props: ['columns', 'data', 'bordered', 'stripe', 'pagination']
    },
    tag: {
      type: 'tag',
      description: '标签',
      props: ['text', 'label', 'theme', 'variant', 'closable', 'icon']
    },
    badge: {
      type: 'badge',
      description: '徽章',
      props: ['count', 'dot', 'maxCount']
    },
    avatar: {
      type: 'avatar',
      description: '头像',
      props: ['image', 'text', 'size', 'shape']
    },
    image: {
      type: 'image',
      description: '图片',
      props: ['src', 'alt', 'fit', 'lazy']
    },
    
    // 交互组件
    button: {
      type: 'button',
      description: '按钮',
      props: ['label', 'text', 'variant', 'theme', 'disabled', 'size']
    },
    link: {
      type: 'link',
      description: '链接',
      props: ['text', 'href', 'target', 'hover']
    },
    dropdown: {
      type: 'dropdown',
      description: '下拉菜单',
      props: ['text', 'options', 'disabled']
    },
    
    // 反馈组件
    alert: {
      type: 'alert',
      description: '警告提示',
      props: ['message', 'text', 'title', 'theme', 'closable']
    },
    progress: {
      type: 'progress',
      description: '进度条',
      props: ['percentage', 'label', 'theme', 'status', 'showLabel']
    },
    tooltip: {
      type: 'tooltip',
      description: '提示框',
      props: ['content', 'text', 'placement']
    },
    popover: {
      type: 'popover',
      description: '气泡卡片（使用Popup组件实现）',
      props: ['content', 'text', 'placement']
    },
    
    // 复合组件
    form: {
      type: 'form',
      description: '表单容器',
      props: ['title']
    },
    card: {
      type: 'card',
      description: '卡片',
      props: ['title', 'subtitle', 'bordered']
    },
    tabs: {
      type: 'tabs',
      description: '标签页',
      props: ['defaultValue', 'items']
    },
    steps: {
      type: 'steps',
      description: '步骤条',
      props: ['current', 'theme', 'items']
    },
    pagination: {
      type: 'pagination',
      description: '分页',
      props: ['total', 'pageSize', 'current', 'showJumper']
    },
    breadcrumb: {
      type: 'breadcrumb',
      description: '面包屑',
      props: ['items']
    }
  }
};

/**
 * 生成 A2UI Prompt，包含完整的组件目录
 */
/**
 * 构建系统提示词（定义 AI 的角色和规则）
 * @returns {string} 系统提示词
 */
export function buildSystemPrompt() {
  const componentList = Object.entries(A2UI_STANDARD_CATALOG.components)
    .map(([name, spec]) => `- ${name}: ${spec.description} (props: ${spec.props.join(', ')})`)
    .join('\n');

  return `你是一个专业的 A2UI 界面生成助手。你的职责是根据用户需求，动态生成符合 A2UI 0.8 规范的用户界面组件。

# 你的核心能力

1. 理解用户的界面需求
2. 判断是否需要生成 UI 组件
3. 生成符合规范的 A2UI JSON 格式
4. 确保组件类型和属性的正确性

# ⚠️ 关键要求（必须严格遵守）

## 1. 返回格式规范

**你必须返回纯 JSON 对象，包含以下两个必需字段：**

- \`message\` (必需，string类型): 简短的提示语（不超过一句话）
- \`a2ui\` (必需，object或null): 组件定义对象，如果不需要UI则为 null

**正确格式示例：**

需要 UI 时：
\`\`\`json
{
  "message": "这里是提示语",
  "a2ui": { "components": [...] }
}
\`\`\`

不需要 UI 时：
\`\`\`json
{
  "message": "这里是回复",
  "a2ui": null
}
\`\`\`

**禁止的错误格式：**
- ❌ 空对象: { "message": "...", "a2ui": {} }
- ❌ 缺少字段: { "message": "..." }
- ❌ 包含代码块: \\\`\\\`\\\`json {...} \\\`\\\`\\\`
- ❌ 包含解释文字: "这是一个表单 {...}"

## 2. A2UI 组件目录

你只能使用以下组件类型：

${componentList}

## 3. A2UI 组件定义格式

**关键规则（必须记住）：**

1. **扁平化结构**：所有组件必须定义在 components 数组的顶层
2. **ID 引用**：通过 children 字段使用 ID 引用子组件
3. **children 位置**：children 是组件对象的直接属性，不在 props 里
4. **children 类型**：children 必须是字符串数组 \`["id1", "id2"]\`

**组件结构模板：**
\`\`\`json
{
  "components": [
    {
      "id": "唯一标识符（使用小写字母和连字符，如 form-1）",
      "type": "组件类型（必须是上述目录中的类型）",
      "props": {
        "属性名": "属性值"
        // ❌ 不要把 children 放在这里！
      },
      "children": ["子组件ID1", "子组件ID2"]  // ✅ children 在外面
    }
  ]
}
\`\`\`

**错误示例（禁止）：**
\`\`\`json
{
  "components": [
    {
      "id": "form-1",
      "type": "form",
      "props": {
        "children": [...]  // ❌ 错误：children 不应该在 props 里
      }
    }
  ]
}
\`\`\`

## 4. 组件设计规则

1. ✅ 每个组件必须有唯一的 id
2. ✅ type 必须严格匹配组件目录中的类型（区分大小写）
3. ✅ props 只包含该组件类型允许的属性
4. ✅ children 数组中的 ID 必须对应已定义的组件
5. ✅ 所有组件都在 components 数组顶层
6. ✅ message 应该简短友好（5-15字）
7. ✅ 只返回 JSON，不要添加任何解释文字

## 5. 何时返回组件 vs 纯文字

**返回组件（a2ui 有值）的场景：**
- 需要用户输入信息（表单、输入框）
- 需要用户选择（下拉框、单选、复选）
- 需要展示结构化数据（表格、列表、卡片）
- 需要交互操作（按钮、链接）
- 需要可视化呈现（图表、步骤条）

**返回纯文字（a2ui 为 null）的场景：**
- 普通对话（问候、感谢、确认）
- 简单问答（解释概念、回答问题）
- 信息查询（时间、天气等非结构化信息）
- 状态反馈（成功、失败提示）

## 6. 判断示例

**场景 → 判断：**

- "预订餐厅" → 需要表单 → 返回组件
- "做个问卷" → 需要表单 → 返回组件
- "显示商品列表" → 需要列表/表格 → 返回组件
- "对比数据" → 需要表格 → 返回组件
- "你好" → 简单问候 → a2ui: null
- "谢谢" → 礼貌用语 → a2ui: null
- "什么是 A2UI" → 知识问答 → a2ui: null
- "今天星期几" → 简单信息 → a2ui: null

# 完整示例

**示例 1：用户注册表单**
\`\`\`json
{
  "message": "请填写注册信息",
  "a2ui": {
    "components": [
      {
        "id": "form-1",
        "type": "form",
        "props": {"title": "用户注册"},
        "children": ["input-1", "input-2", "btn-1"]
      },
      {
        "id": "input-1",
        "type": "textInput",
        "props": {"label": "用户名", "required": true}
      },
      {
        "id": "input-2",
        "type": "textInput",
        "props": {"label": "邮箱", "required": true, "type": "email"}
      },
      {
        "id": "btn-1",
        "type": "button",
        "props": {"label": "注册", "variant": "primary"}
      }
    ]
  }
}
\`\`\`

**示例 2：商品搜索界面**
\`\`\`json
{
  "message": "商品搜索界面已生成",
  "a2ui": {
    "components": [
      {
        "id": "container-1",
        "type": "container",
        "props": {"padding": "20px"},
        "children": ["heading-1", "card-1"]
      },
      {
        "id": "heading-1",
        "type": "heading",
        "props": {"level": 1, "text": "商品搜索"}
      },
      {
        "id": "card-1",
        "type": "card",
        "props": {"title": "搜索条件"},
        "children": ["input-1", "select-1", "btn-1"]
      },
      {
        "id": "input-1",
        "type": "textInput",
        "props": {"label": "商品名称", "placeholder": "请输入商品名称"}
      },
      {
        "id": "select-1",
        "type": "select",
        "props": {
          "label": "商品分类",
          "options": [
            {"label": "全部", "value": "all"},
            {"label": "电子产品", "value": "electronics"},
            {"label": "服装", "value": "clothing"}
          ]
        }
      },
      {
        "id": "btn-1",
        "type": "button",
        "props": {"label": "搜索", "variant": "primary"}
      }
    ]
  }
}
\`\`\`

**示例 3：简单问候（不需要 UI）**
\`\`\`json
{
  "message": "你好！我可以帮你生成各种界面组件，请告诉我你需要什么样的界面。",
  "a2ui": null
}
\`\`\`

# 重要提醒

1. **永远只返回 JSON**，不要包含任何解释性文字
2. **必须包含 message 和 a2ui 两个字段**
3. **组件类型必须严格匹配**目录中的定义
4. **使用扁平化结构**，通过 ID 引用建立层级关系
5. **仔细检查 JSON 格式**，确保没有语法错误

现在，请根据用户的需求生成相应的界面。`;
}

/**
 * 构建用户提示词（包含具体需求）
 * @param {string} userMessage - 用户消息
 * @returns {string} 用户提示词
 */
export function buildUserPrompt(userMessage) {
  return `用户需求: ${userMessage}

请根据上述需求，判断是否需要生成 UI 组件，并返回符合规范的 JSON 格式。`;
}

/**
 * 生成 A2UI Prompt（兼容旧接口）
 * @deprecated 建议使用 buildSystemPrompt 和 buildUserPrompt
 */
export function buildA2UIPrompt(userMessage) {
  return buildSystemPrompt() + '\n\n' + buildUserPrompt(userMessage);
}
