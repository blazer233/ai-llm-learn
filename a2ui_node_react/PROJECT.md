# A2UI 智能界面生成系统

> 基于 CopilotKit + TDesign 的 AI 对话式 UI 生成系统

## 项目简介

A2UI 是一个通过自然语言对话生成用户界面的智能系统。用户只需描述需求，AI 会自动生成符合 A2UI 0.8 规范的界面组件，并使用 TDesign React 组件库进行渲染。

### 核心特性

- 💬 **自然语言交互** - 无需编写代码，用文字描述即可生成界面
- 🎨 **TDesign 组件** - 基于腾讯 TDesign 设计体系，美观专业
- 🤖 **AI 驱动** - 使用腾讯混元大模型，理解能力强
- ✅ **自动验证** - 内置 A2UI JSON Schema 验证，确保输出正确
- 🔄 **智能重试** - AI 输出错误时自动重试，成功率高

## 快速开始

### 1. 环境要求

- Node.js >= 18
- npm 或 yarn

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```bash
# 混元 API 配置（必填）
HUNYUAN_API_KEY=your_hunyuan_api_key_here
HUNYUAN_BASE_URL=http://hunyuanapi.woa.com/openapi/v1

# AI 模型参数（可选）
AI_MODEL=hunyuan-turbo
AI_TEMPERATURE=0.3
AI_MAX_TOKENS=2048
AI_TOP_P=0.95
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 使用示例

在聊天框中输入需求，例如：

### 示例 1：用户注册表单

**输入：** "创建一个用户注册表单，包含用户名、邮箱、密码"

**效果：** AI 会生成包含 3 个输入框和 1 个提交按钮的表单

### 示例 2：商品搜索

**输入：** "做一个商品搜索页面，有关键词输入和分类选择"

**效果：** AI 会生成包含搜索框、下拉选择器和搜索按钮的界面

### 示例 3：问卷调查

**输入：** "帮我设计一个满意度问卷，包含多个选择题"

**效果：** AI 会生成包含多个单选框或复选框的问卷表单

## 项目结构

```
a2ui_node_react/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/
│   │   │   └── copilotkit/          # CopilotKit API 路由
│   │   │       └── [[...slug]]/
│   │   │           └── route.js     # Agent 运行时接口
│   │   ├── page.js                  # 主页面（聊天界面）
│   │   ├── layout.js                # 根布局
│   │   └── globals.css              # 全局样式
│   └── lib/                         # 核心库
│       ├── copilotkit-a2ui-agent.js # A2UI Agent（处理对话）
│       ├── tdesign-a2ui-renderer.jsx # TDesign 渲染器
│       ├── ai-service.js            # 混元 API 封装
│       ├── a2ui-spec.js             # A2UI 规范定义
│       └── a2ui-validator.js        # A2UI 验证器
├── .env.local                       # 环境变量（需自行创建）
├── package.json                     # 项目配置
├── PROJECT.md                       # 项目文档（本文件）
└── TECHNICAL.md                     # 技术文档
```

## 支持的组件类型

基于 A2UI 0.8 标准组件目录：

### 布局组件
- `container` - 通用容器
- `form` - 表单容器
- `card` - 卡片

### 输入组件
- `textInput` - 单行文本输入
- `textArea` - 多行文本输入
- `select` - 下拉选择
- `checkbox` - 复选框
- `radio` - 单选按钮
- `datePicker` - 日期选择器

### 展示组件
- `text` - 文本
- `heading` - 标题
- `paragraph` - 段落
- `list` - 列表
- `table` - 表格

### 交互组件
- `button` - 按钮
- `link` - 链接

### 反馈组件
- `rating` - 评分
- `progress` - 进度条

### 媒体组件
- `image` - 图片
- `chart` - 图表
- `map` - 地图

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行生产服务器
npm start

# 代码检查
npm run lint
```

## 常见问题

### 1. 生成的界面不符合预期？

- 尽量详细描述需求，包括字段名称、布局方式
- 可以多次对话进行调整和优化

### 2. API 调用失败？

- 检查 `.env.local` 中的 `HUNYUAN_API_KEY` 是否正确
- 确认网络可以访问混元 API

### 3. 样式问题？

- 确保已正确引入 TDesign CSS
- 检查浏览器控制台是否有错误

## 技术支持

查看 [技术文档](./TECHNICAL.md) 了解更多技术细节。

## License

MIT
