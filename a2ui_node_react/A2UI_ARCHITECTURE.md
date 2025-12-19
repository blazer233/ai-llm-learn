# A2UI 项目技术文档

## 项目概述

A2UI (AI-to-UI) 是一个基于 **Next.js 14** 和 **TDesign** 的智能界面生成系统，通过自然语言对话动态生成用户界面。项目核心特色是采用了 **A2A (Agent-to-Agent) 协议**和 **JSON-RPC 2.0** 通信标准，实现了大模型与前端的标准化交互。

**技术栈**：
- **前端框架**: Next.js 14 (React 18)
- **UI 组件库**: TDesign React (腾讯开源)
- **大模型**: Google Gemini 2.0 Flash Exp
- **通信协议**: A2A Protocol + JSON-RPC 2.0
- **验证框架**: AJV (JSON Schema 验证)

---

## 一、核心架构：通信与交互流程

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端 (Browser)                           │
├─────────────────────────────────────────────────────────────────┤
│  ChatInterface (用户输入)                                        │
│         ↓                                                        │
│  A2AClient (JSON-RPC 客户端)                                     │
│         ↓                                                        │
│  POST /api/a2a/jsonrpc ←─ JSON-RPC 2.0 请求                     │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ↓ (HTTP POST)
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Route (Server)                    │
├─────────────────────────────────────────────────────────────────┤
│  1. JSON-RPC Router (route.js)                                  │
│     ├─ 验证 JSON-RPC 格式                                        │
│     ├─ 方法路由 (agent.sendMessage)                              │
│     └─ 构建 RequestContext                                       │
│         ↓                                                        │
│  2. A2UIExecutor (执行器)                                        │
│     ├─ 事件总线 (EventBus)                                       │
│     ├─ 调用 A2UIAgent                                            │
│     └─ 收集 Artifacts 和 Messages                                │
│         ↓                                                        │
│  3. A2UIAgent (核心智能代理)                                     │
│     ├─ 构建 Prompt (A2UI 规范)                                   │
│     ├─ 调用 Gemini API                                           │
│     ├─ JSON 解析与修复                                           │
│     ├─ AJV Schema 验证                                           │
│     └─ 重试机制 (最多 2 次)                                      │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ↓ (Google AI SDK)
┌─────────────────────────────────────────────────────────────────┐
│                   Google Gemini 2.0 Flash Exp                    │
│  - 理解用户需求                                                   │
│  - 生成 A2UI JSON                                                │
│  - 遵循组件规范                                                   │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ↓ (JSON Response)
┌─────────────────────────────────────────────────────────────────┐
│                         返回路径                                  │
├─────────────────────────────────────────────────────────────────┤
│  A2UIAgent → Executor → JSON-RPC Response → A2AClient           │
│         ↓                                                        │
│  A2UITDesignRenderer (渲染器)                                    │
│     ├─ 解析 A2UI JSON                                            │
│     ├─ 映射到 TDesign 组件                                       │
│     └─ 动态渲染界面                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、通信协议详解

### 2.1 A2A 协议 (Agent-to-Agent Protocol)

A2A 是一个标准化的 Agent 通信协议，定义了 AI Agent 之间或 Agent 与客户端之间的交互规范。

**核心概念**：

1. **RequestContext** - 请求上下文
```javascript
{
  contextId: "uuid",        // 会话唯一标识
  user: { id: "userId" },   // 用户信息
  messages: [...],          // 消息历史
  configuration: {}         // 配置参数
}
```

2. **Message** - 消息结构
```javascript
{
  messageId: "uuid",
  kind: "message",
  role: "user" | "agent",
  parts: [
    { kind: "text", text: "消息内容" }
  ]
}
```

3. **EventBus** - 事件总线
```javascript
const eventBus = {
  publish: (event) => {},   // 发布事件
  finished: () => {},       // 标记完成
  failed: (error) => {}     // 标记失败
};
```

4. **Artifact** - 结构化数据载体
```javascript
{
  kind: "artifact",
  artifactId: "uuid",
  mimeType: "application/json",
  title: "A2UI Component",
  data: JSON.stringify({ a2ui: {...} })
}
```

### 2.2 JSON-RPC 2.0 协议

**请求格式** (`POST /api/a2a/jsonrpc`):
```json
{
  "jsonrpc": "2.0",
  "method": "agent.sendMessage",
  "params": {
    "message": {
      "messageId": "msg-123",
      "kind": "message",
      "role": "user",
      "parts": [{ "kind": "text", "text": "帮我做个调查问卷" }]
    },
    "contextId": "context-456",
    "user": { "id": "anonymous" }
  },
  "id": "req-789"
}
```

**响应格式** (成功):
```json
{
  "jsonrpc": "2.0",
  "result": {
    "message": {
      "messageId": "msg-124",
      "role": "agent",
      "parts": [
        { "kind": "text", "text": "好的，我已为您准备了问卷界面：" }
      ]
    },
    "artifacts": [
      {
        "artifactId": "artifact-001",
        "mimeType": "application/json",
        "title": "A2UI Component",
        "data": "{\"message\":\"...\",\"a2ui\":{...}}",
        "url": "/api/a2a/artifacts/artifact-001"
      }
    ],
    "contextId": "context-456"
  },
  "id": "req-789"
}
```

**响应格式** (错误):
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "AI 返回了无效的 JSON 格式: Unterminated string"
  },
  "id": "req-789"
}
```

---

## 三、大模型交互机制

### 3.1 A2UIAgent 核心流程

#### 3.1.1 Prompt 构建

`A2UIAgent` 通过精心设计的 Prompt 引导 Gemini 生成符合 A2UI 规范的 JSON：

```javascript
// src/lib/a2ui-spec.js
export function buildA2UIPrompt(userMessage) {
  return `你是一个 A2UI 界面生成助手。根据用户的需求，动态生成符合 A2UI 0.8 规范的用户界面组件。

用户需求: "${userMessage}"

# A2UI 标准组件目录
- container: 通用容器组件
- textInput: 单行文本输入
- select: 下拉选择
- button: 按钮
- form: 表单容器
... (共 25+ 组件)

# 返回格式
{
  "message": "简短的提示语",
  "a2ui": {
    "components": [
      {
        "id": "唯一标识符",
        "type": "组件类型",
        "props": { ... },
        "children": ["子组件ID"]
      }
    ]
  }
}

# 规则
1. 只使用标准组件目录中定义的类型
2. 每个组件必须有唯一的 id
3. children 引用的 ID 必须存在
4. 判断是否需要返回 UI：
   - 需要用户输入/选择 → 返回 a2ui
   - 普通对话 → a2ui: null
`;
}
```

**Prompt 设计要点**：
- ✅ **明确的组件目录**：提供 25+ 标准组件及属性说明
- ✅ **JSON Schema 示例**：通过示例引导正确格式
- ✅ **判断逻辑**：何时返回 UI vs 纯文本
- ✅ **规则约束**：ID 唯一性、引用完整性等

#### 3.1.2 API 调用与配置

```javascript
// src/lib/agent.js
constructor() {
  this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // 生成参数优化
  this.generationConfig = {
    temperature: 0.3,        // 降低温度提高稳定性
    maxOutputTokens: 2048,   // 足够生成复杂 UI
    topP: 0.95,
    topK: 40
  };

  this.model = this.genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: this.generationConfig
  });
}
```

**参数调优策略**：
- **temperature: 0.3** - 低温度确保输出稳定性和格式一致性
- **maxOutputTokens: 2048** - 支持生成包含多个表单字段的复杂界面
- **topP/topK** - 保持生成多样性的同时避免过度发散

### 3.2 智能容错机制

#### 3.2.1 JSON 格式自动修复

当 Gemini 返回格式错误的 JSON 时，系统会尝试自动修复：

```javascript
// src/lib/agent.js
fixCommonJSONErrors(jsonStr) {
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;

  // 1. 检测未闭合的括号/大括号
  for (let i = 0; i < jsonStr.length; i++) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (char === '[') bracketCount++;
    if (char === ']') bracketCount--;
  }

  // 2. 自动补全缺失的闭合符号
  if (braceCount > 0) {
    jsonStr += '}'.repeat(braceCount);
  }
  if (bracketCount > 0) {
    jsonStr += ']'.repeat(bracketCount);
  }

  return jsonStr;
}
```

**修复策略**：
- 检测未闭合的字符串、括号、大括号
- 自动截断到最后一个有效对象位置
- 补全缺失的闭合符号

#### 3.2.2 自适应重试机制

```javascript
async processMessage(userMessage) {
  let attempt = 0;
  let currentQuery = userMessage;

  while (attempt <= this.maxRetries) {  // 最多 2 次尝试
    attempt++;
    
    try {
      const result = await this.model.generateContent(prompt);
      const parsed = this.parseAIResponse(result.response.text());
      
      // 阶段 1: JSON 解析验证
      try {
        parsed = this.parseAIResponse(responseText);
      } catch (parseError) {
        if (attempt <= this.maxRetries) {
          // 🔄 重试 1: JSON 格式错误
          currentQuery = `Your previous response had invalid JSON format: ${parseError.message}
          
Please ensure:
1. All strings are properly closed with double quotes
2. No trailing commas
3. All braces and brackets are properly closed

Original request: "${userMessage}"`;
          continue;
        }
        throw parseError;
      }

      // 阶段 2: Schema 验证
      const validation = validateA2UIResponse(parsed);
      if (!validation.valid) {
        if (attempt <= this.maxRetries) {
          // 🔄 重试 2: Schema 验证失败
          currentQuery = `Your previous response was invalid. Validation errors: ${errors}
Please ensure the response follows the A2UI JSON schema exactly.
Original request: "${userMessage}"`;
          continue;
        }
      }

      return { text: parsed.message, a2ui: parsed.a2ui };

    } catch (error) {
      if (attempt > this.maxRetries) {
        throw new Error(lastError || '生成界面失败');
      }
    }
  }
}
```

**重试策略分析**：

| 阶段 | 验证内容 | 失败处理 | 重试 Prompt 优化 |
|------|----------|----------|------------------|
| **阶段 1** | JSON 语法解析 | 自动修复 → 重试 | 提供格式检查清单 |
| **阶段 2** | A2UI Schema 验证 | 详细错误提示 → 重试 | 指出具体验证错误 |
| **阶段 3** | 子组件引用完整性 | 抛出错误 | 不重试（致命错误） |

**渐进式错误修正**：
1. 第 1 次尝试：使用原始用户请求
2. 第 2 次尝试：添加 JSON 格式要求和错误原因
3. 失败后：抛出真实错误信息（不降级）

### 3.3 JSON Schema 验证

使用 **AJV** 进行严格的 Schema 验证：

```javascript
// src/lib/a2ui-validator.js
const A2UI_SCHEMA = {
  type: 'object',
  required: ['message', 'a2ui'],
  properties: {
    message: { type: 'string' },
    a2ui: {
      oneOf: [
        { type: 'null' },
        {
          type: 'object',
          required: ['components'],
          properties: {
            components: {
              type: 'array',
              minItems: 1,
              items: {
                required: ['id', 'type', 'props'],
                properties: {
                  id: { type: 'string', minLength: 1 },
                  type: {
                    enum: [
                      'container', 'textInput', 'select', 'button', 
                      'form', 'card', 'table', 'chart', ...
                    ]
                  },
                  props: { type: 'object' },
                  children: { 
                    type: 'array', 
                    items: { type: 'string' } 
                  }
                }
              }
            }
          }
        }
      ]
    }
  }
};

// 额外验证：子组件引用完整性
const componentIds = new Set(a2ui.components.map(c => c.id));
for (const component of a2ui.components) {
  if (component.children) {
    for (const childId of component.children) {
      if (!componentIds.has(childId)) {
        // ❌ 引用的子组件不存在
        return { valid: false, errors: [...] };
      }
    }
  }
}
```

**验证层级**：
1. **基础类型验证** - 字段类型、必填性
2. **枚举约束** - 组件类型必须在标准目录中
3. **引用完整性** - children 引用的 ID 必须存在
4. **结构完整性** - 至少包含 1 个组件

---

## 四、前端渲染机制

### 4.1 A2UI → TDesign 映射

`A2UITDesignRenderer` 负责将抽象的 A2UI JSON 渲染为具体的 TDesign 组件：

```javascript
// src/components/A2UITDesignRenderer.jsx
const renderComponent = (component) => {
  const { id, type, props, children } = component;

  switch (type) {
    case 'textInput':
      return (
        <FormItem label={props.label} name={id}>
          <Input
            placeholder={props.placeholder}
            value={formData[id] || ''}
            onChange={(value) => handleInputChange(id, value)}
            clearable
          />
        </FormItem>
      );

    case 'select':
      return (
        <FormItem label={props.label} name={id}>
          <Select
            value={formData[id] || ''}
            onChange={(value) => handleInputChange(id, value)}
          >
            {props.options?.map((option, idx) => (
              <Option key={idx} value={option.value} label={option.label} />
            ))}
          </Select>
        </FormItem>
      );

    case 'form':
      return (
        <Form onSubmit={handleSubmit}>
          {props.title && <Title level={3}>{props.title}</Title>}
          {children?.map(childId => {
            const child = a2ui.components.find(c => c.id === childId);
            return renderComponent(child);
          })}
        </Form>
      );

    // ... 25+ 组件映射
  }
};
```

**渲染策略**：
- **递归渲染** - 自动处理组件树（通过 children 引用）
- **状态管理** - 统一的 `formData` 管理所有输入
- **事件绑定** - `handleInputChange` 收集用户输入
- **提交处理** - `handleSubmit` 触发表单提交

### 4.2 组件分类与实现

| 分类 | 组件类型 | TDesign 映射 | 特性 |
|------|----------|--------------|------|
| **布局** | container | Space | 支持横向/纵向布局 |
| **输入** | textInput, select, datePicker | Input, Select, DatePicker | 双向绑定 + 验证 |
| **展示** | text, heading, table | Text, Title, Table | 只读展示 |
| **复合** | form, card, tabs | Form, Card, Tabs | 包含子组件 |
| **交互** | button, link | Button, Link | 事件处理 |
| **媒体** | image, chart, map | Image, Card | 懒加载 + 占位 |

---

## 五、错误处理与日志

### 5.1 错误传递链路

```
Gemini API Error
    ↓
A2UIAgent.processMessage() - 捕获并包装
    ↓
A2UIExecutor.execute() - eventBus.failed(error)
    ↓
JSON-RPC route.js - createErrorResponse(code, error.message)
    ↓
A2AClient.sendMessage() - throw new Error(rpcResponse.error.message)
    ↓
ChatInterface - 显示红色错误消息
```

**错误分类**：

| 错误码 | 含义 | 示例 |
|--------|------|------|
| -32600 | Invalid Request | JSON-RPC 格式错误 |
| -32601 | Method Not Found | 未知的 RPC 方法 |
| -32602 | Invalid Params | 缺少必填参数 |
| -32000 | Application Error | AI 生成失败、验证错误 |

### 5.2 控制台日志设计

```javascript
// 成功流程
🤖 A2UI Agent initialized with model: gemini-2.0-flash-exp
📊 Generation config: { temperature: 0.3, ... }
🔄 Attempt 1/2 for: "帮我做个调查问卷"
✅ Valid response received on attempt 1
📤 Event published: artifact
✅ A2A request completed successfully

// 错误流程
🔄 Attempt 1/2 for: "帮我做个调查问卷"
❌ JSON parse error on attempt 1: Unterminated string at position 651
⚠️ Retrying after error...
🔄 Attempt 2/2 for: "帮我做个调查问卷"
✅ Valid response received on attempt 2
```

---

## 六、技术亮点与创新

### 6.1 协议标准化

✅ **采用 A2A 协议** - 不是自定义协议，而是遵循工业标准  
✅ **JSON-RPC 2.0** - 清晰的请求/响应格式，易于调试和扩展  
✅ **Artifact 机制** - 结构化数据与消息分离，支持多模态输出

### 6.2 智能容错

✅ **JSON 自动修复** - 处理 LLM 常见的格式错误  
✅ **自适应重试** - 根据错误类型动态调整 Prompt  
✅ **Schema 验证** - 双重保障（语法 + 语义）

### 6.3 工程化实践

✅ **模块化设计** - Agent、Executor、Validator 职责清晰  
✅ **环境变量配置** - 模型参数可调节  
✅ **完整的错误链路** - 从 API 到 UI 的透明错误传递  
✅ **类型安全** - JSON Schema + AJV 验证

---

## 七、使用示例

### 7.1 用户请求流程

**用户输入**: "帮我做个调查问卷"

**Gemini 生成 (A2UI JSON)**:
```json
{
  "message": "已为您准备好问卷界面：",
  "a2ui": {
    "components": [
      {
        "id": "form-1",
        "type": "form",
        "props": { "title": "用户满意度调查" },
        "children": ["q1", "q2", "q3", "submit-btn"]
      },
      {
        "id": "q1",
        "type": "textInput",
        "props": { "label": "您的姓名", "required": true }
      },
      {
        "id": "q2",
        "type": "select",
        "props": {
          "label": "满意度评分",
          "options": [
            { "value": "5", "label": "非常满意" },
            { "value": "4", "label": "满意" },
            { "value": "3", "label": "一般" }
          ]
        }
      },
      {
        "id": "q3",
        "type": "textArea",
        "props": { "label": "建议", "rows": 4 }
      },
      {
        "id": "submit-btn",
        "type": "button",
        "props": { "label": "提交", "variant": "primary", "action": "submit" }
      }
    ]
  }
}
```

**TDesign 渲染结果**:
- 带标题的表单容器
- 必填的姓名输入框
- 满意度下拉选择器
- 多行建议文本域
- 主题色提交按钮

---

## 八、环境配置

### 8.1 必需环境变量

```bash
# .env.local
GEMINI_API_KEY=your_gemini_api_key

# 可选配置
AI_MODEL=gemini-2.0-flash-exp
AI_TEMPERATURE=0.3
AI_MAX_TOKENS=2048
AI_TOP_P=0.95
AI_TOP_K=40
```

### 8.2 启动项目

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 访问
http://localhost:3000
```

---

## 九、性能优化建议

1. **Prompt 缓存** - 缓存标准 Prompt 模板，减少字符串拼接
2. **流式响应** - 实现 SSE 支持，边生成边渲染
3. **组件懒加载** - 大型组件（chart, map）按需加载
4. **请求合并** - 批量处理多个用户消息
5. **错误重试指数退避** - 避免快速连续重试

---

## 十、总结

A2UI 项目通过标准化的 **A2A 协议**和 **JSON-RPC 2.0** 实现了大模型与前端的解耦通信，核心创新在于：

1. **协议标准化** - 不依赖特定大模型，易于扩展到其他 LLM
2. **智能容错** - 自动修复 JSON 错误 + 自适应重试机制
3. **严格验证** - AJV Schema 确保 UI 定义的正确性
4. **优雅降级** - 纯文本对话 vs UI 生成的智能判断

这套架构可扩展至：
- **多模型支持** (Claude, GPT-4, 文心一言)
- **流式渲染** (SSE + Incremental UI)
- **Agent 编排** (多个 Agent 协同生成复杂界面)

---

**项目地址**: `/Users/songyanchao/Desktop/thing/zhishi/a2ui_node_react`  
**核心依赖**: `@a2a-js/sdk`, `@google/generative-ai`, `tdesign-react`, `ajv`
