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
      description: '气泡卡片',
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
export function buildA2UIPrompt(userMessage) {
  const componentList = Object.entries(A2UI_STANDARD_CATALOG.components)
    .map(([name, spec]) => `- ${name}: ${spec.description} (props: ${spec.props.join(', ')})`)
    .join('\n');

  return `你是一个 A2UI 界面生成助手。根据用户的需求，动态生成符合 A2UI 0.8 规范的用户界面组件。

用户需求: "${userMessage}"

# A2UI 标准组件目录

${componentList}

# 返回格式

请返回 JSON 格式，包含两个字段：
1. message: 简短的提示语（不超过一句话）
2. a2ui: 组件定义对象，如果不需要UI则为 null

## A2UI 组件定义格式（重要！）

**关键规则**：
1. 所有组件必须扁平化定义在 components 数组中
2. children 是组件对象的直接属性（不在 props 里）
3. children 必须是字符串数组（子组件的 ID 引用）
4. 绝对不要嵌套组件定义！

\`\`\`json
{
  "components": [
    {
      "id": "唯一标识符",
      "type": "组件类型（必须是上述目录中的类型）",
      "props": {
        "属性名": "属性值"
        // ❌ 不要把 children 放在 props 里！
      },
      "children": ["子组件ID1", "子组件ID2"]  // ✅ children 是字符串数组
    }
  ]
}
\`\`\`

# 规则

1. ✅ 只使用标准组件目录中定义的组件类型
2. ✅ 每个组件必须有唯一的 id
3. ✅ props 只包含该组件类型允许的属性，**不包含 children**
4. ✅ **children 是组件对象的直接属性，值必须是字符串数组（ID引用）**
5. ✅ children 数组中的ID必须对应已定义的组件
6. ✅ 所有组件都在 components 数组顶层，通过 children 引用建立层级关系
7. ✅ message 应该简短友好，不要重复解释需求
8. ✅ 只返回 JSON，不要其他解释
9. ✅ **何时返回组件 vs 纯文字**：
   - 返回组件（a2ui）：需要用户输入、选择、填表、查看结构化数据时
   - 返回纯文字（a2ui: null）：普通对话、问候、感谢、简单问答时

# 判断示例

需要返回组件的场景：
- "预订餐厅" → 需要表单
- "做个问卷" → 需要表单
- "显示列表" → 需要列表组件
- "对比数据" → 需要表格

只需要返回文字的场景：
- "你好" → 问候
- "谢谢" → 礼貌
- "什么是A2UI" → 知识问答
- "今天星期几" → 简单信息

# 返回示例

**示例 1：用户注册表单**
\`\`\`json
{
  "message": "请填写注册信息：",
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
        "props": {"label": "邮箱", "required": true}
      },
      {
        "id": "btn-1",
        "type": "button",
        "props": {"label": "注册", "variant": "primary", "action": "submit"}
      }
    ]
  }
}
\`\`\`

**示例 2：商品搜索（带嵌套结构）**
\`\`\`json
{
  "message": "商品搜索界面",
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
        "children": ["input-search", "select-category", "btn-search"]
      },
      {
        "id": "input-search",
        "type": "textInput",
        "props": {"label": "关键词", "placeholder": "输入商品名称"}
      },
      {
        "id": "select-category",
        "type": "select",
        "props": {
          "label": "分类",
          "options": [
            {"value": "all", "label": "全部"},
            {"value": "electronics", "label": "电子产品"}
          ]
        }
      },
      {
        "id": "btn-search",
        "type": "button",
        "props": {"label": "搜索", "variant": "primary", "action": "search"}
      }
    ]
  }
}
\`\`\``;
}
