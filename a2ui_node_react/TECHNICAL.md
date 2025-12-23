# A2UI 技术文档

> 深入了解 A2UI 系统的技术架构和核心依赖

## 技术栈架构

```
┌─────────────────────────────────────────┐
│     用户界面 (Next.js + React)           │
│  ┌──────────────────────────────────┐  │
│  │   CopilotChat (聊天界面)          │  │
│  └──────────┬───────────────────────┘  │
└─────────────┼───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│    CopilotKit Runtime (协调层)          │
│  ┌──────────────────────────────────┐  │
│  │  A2UIAgent (AbstractAgent)       │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │  Observable (RxJS 流式)     │  │  │
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│      AI Service (腾讯混元 API)          │
│  ┌──────────────────────────────────┐  │
│  │  Prompt → AI → A2UI JSON        │  │
│  └──────────────────────────────────┘  │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│    Validator & Renderer (渲染层)        │
│  ┌──────────────────────────────────┐  │
│  │  JSON Schema (Ajv)               │  │
│  │  TDesign Components (30+ 组件)   │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## TDesign 组件映射

### 支持的组件类型（30+ 种）

A2UI 现已完整映射到 TDesign React 组件库，支持以下组件：

#### 布局组件
- `container` → Space (带方向和间距)
- `space` → Space (灵活布局)
- `divider` → Divider (分割线)

#### 表单输入组件
- `textInput` → Input
- `textArea` → Input (textarea 模式)
- `checkbox` → Checkbox
- `radio` → Radio
- `radioGroup` → RadioGroup
- `select` → Select
- `switch` → Switch
- `slider` → Slider
- `datePicker` → DatePicker
- `timePicker` → TimePicker
- `upload` → Upload

#### 展示组件
- `heading` → Typography.Title / h1-h6
- `paragraph` → Typography.Paragraph / p
- `text` → Typography.Text / span
- `link` → Link
- `image` → Image
- `list` → List
- `table` → Table
- `tag` → Tag
- `badge` → Badge
- `avatar` → Avatar

#### 反馈组件
- `alert` → Alert
- `progress` → Progress
- `tooltip` → Tooltip
- `popover` → Popover

#### 复合组件
- `form` → Form
- `card` → Card
- `tabs` → Tabs
- `steps` → Steps
- `pagination` → Pagination
- `breadcrumb` → Breadcrumb
- `dropdown` → Dropdown

### 组件映射示例

```javascript
// A2UI JSON 定义
{
  "id": "btn-1",
  "type": "button",
  "props": {
    "label": "提交",
    "variant": "primary",
    "size": "medium"
  }
}

// 渲染为 TDesign 组件
<Button 
  variant="base" 
  theme="primary" 
  size="medium"
>
  提交
</Button>
```

## 核心依赖详解

### 1. CopilotKit

**版本:** `@copilotkit/runtime@^1.4.1`

**作用:** 提供 AI 对话基础设施，简化 Agent 开发

**核心概念:**

- **CopilotRuntime** - 运行时环境，管理 Agent 执行
- **CopilotChat** - React 聊天组件，提供对话 UI
- **Agent** - 智能代理，处理用户输入
- **Activity Renderer** - 自定义渲染器（用于显示 A2UI）

#### 前端集成 (`src/app/page.js`)

```javascript
import { CopilotChat, CopilotKitProvider } from '@copilotkit/react-core/v2';

const activityRenderers = [TDesignRenderer];

<CopilotKitProvider
  runtimeUrl="/api/copilotkit"
  renderActivityMessages={activityRenderers}
>
  <CopilotChat placeholder="描述您想要的界面..." />
</CopilotKitProvider>
```

#### 后端集成 (`src/app/api/copilotkit/[[...slug]]/route.js`)

```javascript
import { CopilotRuntime, InMemoryAgentRunner } from '@copilotkit/runtime/v2';

const agentRunner = new InMemoryAgentRunner({
  agents: [new A2UIAgent()],
});

const app = new CopilotRuntime({
  agentRunners: [agentRunner],
});

export const { GET, POST } = createCopilotEndpoint({ app });
```

---

### 2. @ag-ui/client

**版本:** `@ag-ui/client@^0.1.4`

**作用:** 提供 Agent 基类和协议标准

**核心类:**

- **AbstractAgent** - Agent 抽象基类

#### 继承实现 (`src/lib/copilotkit-a2ui-agent.js`)

```javascript
import { AbstractAgent } from '@ag-ui/client';

export class A2UIAgent extends AbstractAgent {
  constructor(config = {}) {
    super({
      agentId: 'a2ui-agent',
      description: 'AI-powered UI generation agent',
      threadId: config.threadId,
      initialMessages: [],
      initialState: {},
    });
  }

  // 必须实现
  run(input) {
    return new Observable(observer => {
      // 处理消息逻辑
    });
  }

  clone() {
    return new A2UIAgent({...});
  }
}
```

**关键方法:**

- `run(input)` - 处理用户消息，返回 Observable
- `clone()` - 克隆 Agent 实例
- `messages` / `state` - 对话历史和状态管理

---

### 3. RxJS

**版本:** `rxjs@^7.8.1`

**作用:** 实现流式响应，支持异步事件流

**核心概念:**

- **Observable** - 可观察对象（数据流）
- **Observer** - 观察者（订阅数据）

#### 流式响应实现

```javascript
import { Observable } from 'rxjs';

run(input) {
  return new Observable(observer => {
    (async () => {
      // 1. 开始运行
      observer.next({ type: 'RUN_STARTED', runId, threadId });

      // 2. 发送文本消息
      observer.next({ type: 'TEXT_MESSAGE_START', messageId });
      observer.next({ type: 'TEXT_MESSAGE_CONTENT', delta: '内容' });
      observer.next({ type: 'TEXT_MESSAGE_END', messageId });

      // 3. 发送 A2UI 组件
      observer.next({
        type: 'ACTIVITY_SNAPSHOT',
        activityType: 'a2ui-surface',
        content: { operations: [a2ui] },
      });

      // 4. 完成
      observer.next({ type: 'RUN_FINISHED', runId, threadId });
      observer.complete();
    })();
  });
}
```

**事件类型:**

- `RUN_STARTED` / `RUN_FINISHED` - 运行生命周期
- `TEXT_MESSAGE_*` - 文本消息
- `ACTIVITY_SNAPSHOT` - 自定义内容（A2UI）
- `RUN_ERROR` - 错误

**优势:**

- ✅ 支持流式输出（逐步显示）
- ✅ 多类型事件（文本 + 组件）
- ✅ CopilotKit 原生支持

---

## 文件关系图

```
src/app/page.js
├─ 导入: CopilotKitProvider, CopilotChat
├─ 导入: createTDesignA2UIRenderer
└─ 注册: activityRenderers
    │
src/app/api/copilotkit/[[...slug]]/route.js
├─ 导入: CopilotRuntime, InMemoryAgentRunner
├─ 导入: A2UIAgent
└─ 创建: Endpoint
    │
src/lib/copilotkit-a2ui-agent.js
├─ 继承: AbstractAgent (@ag-ui/client)
├─ 使用: Observable (rxjs)
├─ 调用: ai-service.js
├─ 调用: a2ui-spec.js
└─ 调用: a2ui-validator.js
    │
    ├─────────────┬─────────────┬──────────────┐
    │             │             │              │
ai-service.js  a2ui-spec.js  a2ui-validator.js
混元 API 封装   规范定义      JSON Schema 验证
    │
src/lib/tdesign-a2ui-renderer.jsx
├─ 导入: TDesign React
├─ 接收: A2UI JSON
└─ 输出: React Element
```

---

## 数据流详解

### 1. 用户发送消息

```
用户输入 "创建用户注册表单"
  ↓
CopilotChat 发送 POST /api/copilotkit
  body: { messages, runId, threadId }
  ↓
CopilotRuntime 调用 A2UIAgent.run()
  ↓
提取用户消息: messages[messages.length - 1].content
  ↓
调用 processMessage(userInput)
```

### 2. AI 生成界面

```
buildA2UIPrompt(userInput)
  → 生成包含 A2UI 规范的 Prompt
  ↓
aiService.generateContent(prompt)
  → 调用腾讯混元 API
  ↓
混元返回 JSON:
{
  "message": "请填写注册信息：",
  "a2ui": {
    "components": [
      { "id": "form-1", "type": "form", ... },
      { "id": "input-1", "type": "textInput", ... }
    ]
  }
}
  ↓
validateA2UIResponse(parsed)
  → 验证格式和引用
  ↓
验证失败 → 重试（最多 2 次）
验证成功 → 返回结果
```

### 3. 渲染组件

```
observer.next({
  type: 'ACTIVITY_SNAPSHOT',
  activityType: 'a2ui-surface',
  content: { operations: [a2ui] }
})
  ↓
CopilotKit 匹配 activityType
  ↓
调用 TDesignRenderer.render({ content })
  ↓
解析 components:
  - 提取 rootComponents
  - 递归渲染 children
  - 映射到 TDesign 组件
  ↓
返回 React Element
  ↓
在聊天界面中显示
```

---

## 关键技术细节

### A2UI 协议

**原则:** 扁平化 + ID 引用

```json
{
  "message": "简短提示",
  "a2ui": {
    "components": [
      {
        "id": "form-1",
        "type": "form",
        "props": { "title": "用户注册" },
        "children": ["input-1", "input-2"]
      },
      {
        "id": "input-1",
        "type": "textInput",
        "props": { "label": "用户名" }
      }
    ]
  }
}
```

**优势:**

- ✅ AI 容易生成（避免深层嵌套）
- ✅ 引用关系清晰
- ✅ 易于验证

### 智能重试机制

```javascript
for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
  try {
    const parsed = this.parseAIResponse(responseText);
    const validation = validateA2UIResponse(parsed);

    if (!validation.valid) {
      // 验证失败 → 重试
      currentQuery = this.buildRetryQuery(userMessage, errors);
      continue;
    }

    return parsed;
  } catch (error) {
    if (error.name === 'SyntaxError') {
      // JSON 解析失败 → 重试
      currentQuery = this.buildRetryQuery(userMessage, error);
      continue;
    }
  }
}
```

**策略:**

- JSON 解析失败 → 告诉 AI 哪里错了
- Schema 验证失败 → 提供错误详情
- 最多重试 2 次

### 组件映射

```javascript
const componentMap = {
  form: () => <Form><Space>{children}</Space></Form>,
  textInput: () => <div><FormLabel /><Input /></div>,
  button: () => <Button theme="primary">{label}</Button>,
};

const Component = componentMap[type];
return Component ? Component() : null;
```

---

## 日志规范

### AI Service

```javascript
console.log('🤖 AI Service 初始化:', { model, temperature });
console.log('📤 发送请求到混元 API:', { promptLength });
console.log('✅ 混元 API 响应成功:', { duration, usage });
console.error('❌ 混元 API 错误:', status, errorData);
```

### Agent

```javascript
console.log('🚀 Agent 开始运行:', { runId, threadId });
console.log('📝 用户输入:', userInput);
console.log('🔄 第 N 次尝试生成界面');
console.warn('⚠️ A2UI 验证失败:', errors);
console.log('🎨 发送 A2UI 组件:', componentCount);
console.log('✅ Agent 运行完成');
```

---

## 扩展开发

### 添加新组件类型

1. 在 `a2ui-spec.js` 的 `A2UI_STANDARD_CATALOG.components` 添加定义
2. 在 `a2ui-validator.js` 的 Schema `enum` 中添加类型
3. 在 `tdesign-a2ui-renderer.jsx` 的 `componentMap` 中添加渲染

### 切换 AI 模型

```bash
AI_MODEL=hunyuan-pro
AI_TEMPERATURE=0.5
AI_MAX_TOKENS=4096
```

---

## 故障排查

### Agent 不响应

**检查:**

- 浏览器控制台错误
- `/api/copilotkit` 路由是否正常
- Agent 是否注册到 `InMemoryAgentRunner`

### AI 返回格式错误

**检查:**

- 混元 API 是否正常（查看日志）
- Prompt 是否完整
- 是否触发重试（查看 console）

### 组件渲染异常

**检查:**

- A2UI JSON 是否通过验证
- `children` 引用的 ID 是否存在
- `componentMap` 是否支持该类型

---

## 总结

| 依赖 | 作用 | 文件 |
|------|------|------|
| **CopilotKit** | 对话基础设施，管理 Agent | `page.js`, `route.js` |
| **@ag-ui/client** | Agent 标准接口 | `copilotkit-a2ui-agent.js` |
| **RxJS** | 流式响应，事件流 | `copilotkit-a2ui-agent.js` |
| **A2UI** | 组件协议，JSON 格式 | `a2ui-spec.js`, `a2ui-validator.js` |
| **TDesign** | UI 组件库 | `tdesign-a2ui-renderer.jsx` |

**核心流程:** 用户输入 → Agent → AI 生成 JSON → 验证 → TDesign 渲染 → 显示
