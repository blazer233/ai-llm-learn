# MidsceneJS 可视化设计器

## 📖 项目简介

MidsceneJS 可视化设计器是一个基于 React + Node.js 的 Web 自动化测试流程设计工具。通过拖拽式界面，用户可以轻松创建包含条件分支的自动化测试流程，支持 AI 驱动的网页元素识别和操作。

## 🚀 核心特性

### ✨ 可视化流程设计
- **拖拽式节点编辑器** - 直观的流程图设计界面
- **实时预览** - 所见即所得的流程展示
- **条件分支支持** - AI验证节点支持成功/失败分支路由
- **智能连接** - 自动识别节点类型并提供相应的连接点

### 🤖 AI 驱动的自动化
- **智能元素识别** - 基于自然语言描述定位页面元素
- **多模态AI支持** - 支持腾讯混元视觉模型等多种AI服务
- **自适应操作** - AI自动适应不同网页布局和元素变化

### 🎯 丰富的节点类型
- **基础操作**: 页面导航、等待、截图
- **AI功能**: 智能点击、智能输入、智能验证
- **流程控制**: 条件分支、结束节点

## 🛠️ 技术架构

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   React 前端    │ ──────────────► │  Node.js 后端   │
│  (端口: 3001)   │                │  (端口: 3002)   │
│                 │                │                 │
│ • 流程设计界面  │                │ • MidsceneJS    │
│ • 节点拖拽编辑  │                │ • Playwright    │
│ • 实时结果展示  │                │ • AI模型集成    │
└─────────────────┘                └─────────────────┘
```

### 前端技术栈
- **React 18** - 用户界面框架
- **ReactFlow** - 流程图编辑器
- **Vite** - 构建工具和开发服务器
- **CSS3** - 样式和动画

### 后端技术栈
- **Node.js + Express** - 服务器框架
- **MidsceneJS** - Web自动化测试框架
- **Playwright** - 浏览器自动化引擎
- **腾讯混元视觉** - AI模型服务

## 📦 安装与配置

### 1. 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- 现代浏览器 (Chrome/Edge/Firefox)

### 2. 项目安装
```bash
# 克隆项目
git clone <repository-url>
cd midscene-designer

# 安装依赖
npm install
```

### 3. 环境配置
创建 `.env` 文件并配置AI模型：

```env
# 腾讯混元视觉模型配置
OPENAI_API_KEY=your_hunyuan_api_key
OPENAI_BASE_URL=https://hunyuan.tencentcloudapi.com/v1
MIDSCENE_MODEL_NAME=hunyuan-vision
```

#### 支持的AI模型配置

**腾讯混元视觉 (推荐)**
```env
OPENAI_API_KEY=your_hunyuan_api_key
OPENAI_BASE_URL=https://hunyuan.tencentcloudapi.com/v1
MIDSCENE_MODEL_NAME=hunyuan-vision
```

**阿里云通义千问**
```env
OPENAI_API_KEY=your_dashscope_api_key
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MIDSCENE_MODEL_NAME=qwen-vl-max-latest
MIDSCENE_USE_QWEN3_VL=1
```

**智谱AI GLM**
```env
OPENAI_API_KEY=your_zhipu_api_key
OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
MIDSCENE_MODEL_NAME=glm-4v-plus
MIDSCENE_USE_ZHIPU_AI=1
```

### 4. 启动服务

```bash
# 启动后端服务器 (端口: 3002)
npm run server

# 启动前端开发服务器 (端口: 3001)
npm run dev
```

## 🎮 使用指南

### 基础操作

#### 1. 创建流程
1. 打开浏览器访问 `http://localhost:3001`
2. 从左侧节点面板拖拽节点到画布
3. 点击节点可编辑配置参数
4. 连接节点创建执行流程

#### 2. 节点配置
- **导航节点**: 设置目标URL
- **AI点击**: 描述要点击的元素 (如: "登录按钮", "搜索图标")
- **AI输入**: 设置目标输入框和输入内容
- **AI验证**: 编写验证指令 (如: "页面包含用户名")
- **截图**: 设置截图文件名
- **等待**: 设置等待时间(毫秒)

#### 3. 条件分支设计
AI验证节点提供两个输出连接点：
- 🟢 **成功分支** (左侧绿色) - 验证通过时执行
- 🔴 **失败分支** (右侧红色) - 验证失败时执行

### 高级功能

#### 1. 复杂流程示例
```
开始 → 导航到登录页 → AI验证(页面加载完成)
                        ├─成功→ AI输入用户名 → AI输入密码 → AI点击登录
                        └─失败→ 等待3秒 → 截图 → 结束
```

#### 2. 错误处理
- 节点执行失败时自动走失败分支
- 支持多层错误处理和重试逻辑
- 自动生成详细的执行日志

#### 3. 代码生成
点击"📋 复制代码"按钮可生成对应的 MidsceneJS 代码：

```javascript
// 自动生成的代码示例
import { PlaywrightAgent } from '@midscene/web';
import playwright from 'playwright';

async function runTest() {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const agent = new PlaywrightAgent(page);

  try {
    await page.goto('https://example.com');
    await agent.aiTap('登录按钮');
    await agent.aiInput('用户名输入框', 'testuser');
    await agent.aiAssert('页面显示欢迎信息');
  } finally {
    await browser.close();
  }
}
```

## 📋 节点类型详解

### 🌐 基础操作

#### 导航节点
- **功能**: 导航到指定URL
- **配置**: `url` - 目标网址
- **示例**: `https://www.example.com`

#### 等待节点
- **功能**: 等待指定时间
- **配置**: `duration` - 等待时间(毫秒)
- **示例**: `3000` (等待3秒)

#### 截图节点
- **功能**: 保存页面截图
- **配置**: `name` - 截图文件名
- **输出**: 截图保存在 `screenshots/` 目录

### 🤖 AI功能

#### AI点击节点
- **功能**: 使用AI识别并点击页面元素
- **配置**: `target` - 元素描述
- **示例**: 
  - `"登录按钮"`
  - `"右上角的用户头像"`
  - `"搜索框旁边的放大镜图标"`

#### AI输入节点
- **功能**: 使用AI识别输入框并输入内容
- **配置**: 
  - `target` - 输入框描述
  - `value` - 输入内容
- **示例**:
  - 目标: `"用户名输入框"`, 内容: `"admin"`
  - 目标: `"搜索框"`, 内容: `"MidsceneJS"`

#### AI验证节点 (支持分支)
- **功能**: 验证页面状态，支持条件分支
- **配置**: `instruction` - 验证指令
- **输出**: 两个连接点 (成功/失败)
- **示例**:
  - `"页面显示登录成功信息"`
  - `"用户头像出现在右上角"`
  - `"页面包含错误提示信息"`

### 🎮 流程控制

#### 结束节点
- **功能**: 结束测试并关闭浏览器
- **特点**: 无输出连接点，到达即停止
- **自动操作**: 关闭浏览器实例，清理资源

## 🔧 API 接口

### 执行流程 API
```http
POST /api/execute
Content-Type: application/json

{
  "nodes": [
    {
      "id": "navigate-1",
      "type": "custom",
      "data": {
        "type": "navigate",
        "config": { "url": "https://example.com" }
      }
    }
  ],
  "edges": [
    {
      "source": "navigate-1",
      "target": "aiTap-2",
      "data": { "condition": "success" }
    }
  ]
}
```

### 响应格式
```json
{
  "success": true,
  "results": [
    {
      "nodeId": "navigate-1",
      "success": true,
      "message": "导航到 https://example.com",
      "executionTime": 1250
    }
  ],
  "statistics": {
    "totalNodes": 5,
    "successCount": 4,
    "failureCount": 1,
    "totalExecutionTime": 8500,
    "averageExecutionTime": 1700
  }
}
```

## 🐛 故障排除

### 常见问题

#### 1. AI模型连接失败
**症状**: 执行时提示 API key 错误或连接超时
**解决方案**:
- 检查 `.env` 文件中的 API key 是否正确
- 确认 `OPENAI_BASE_URL` 配置正确
- 验证网络连接和防火墙设置
- 重启后端服务器: `npm run server`

#### 2. 浏览器启动失败
**症状**: 执行时提示浏览器无法启动
**解决方案**:
- 确保系统已安装 Chrome/Chromium
- 检查系统权限设置
- 尝试以管理员权限运行

#### 3. 元素识别失败
**症状**: AI无法找到指定的页面元素
**解决方案**:
- 使用更具体的元素描述
- 确保页面完全加载后再执行操作
- 添加等待节点给页面更多加载时间
- 检查元素是否在当前视窗内

#### 4. 端口占用
**症状**: 启动时提示端口被占用
**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :3001  # 前端端口
lsof -i :3002  # 后端端口

# 终止进程
kill -9 <PID>
```

### 调试技巧

#### 1. 查看执行日志
后端服务器会输出详细的执行日志：
```
📍 [1] 执行节点: navigate-1 (navigate)
🌐 导航到: https://example.com
✅ 节点 navigate-1 执行成功
➡️ 下一个节点: aiTap-2 (条件: 无条件)
```

#### 2. 使用截图节点
在关键步骤添加截图节点，便于调试：
```
导航 → 截图(页面加载) → AI操作 → 截图(操作结果)
```

#### 3. 分步测试
将复杂流程拆分为小步骤，逐步验证每个环节。

## 📚 最佳实践

### 1. 流程设计原则
- **单一职责**: 每个节点只做一件事
- **明确描述**: 使用清晰、具体的元素描述
- **错误处理**: 为关键步骤添加失败分支
- **适当等待**: 在页面跳转后添加等待时间

### 2. AI描述技巧
**好的描述**:
- `"页面右上角的登录按钮"`
- `"标题为'用户名'的输入框"`
- `"包含'提交'文字的蓝色按钮"`

**避免的描述**:
- `"按钮"` (太模糊)
- `"第一个输入框"` (位置可能变化)
- `"div"` (技术术语，AI难以理解)

### 3. 性能优化
- 合理使用等待节点，避免不必要的长时间等待
- 在流程末尾添加结束节点，及时释放资源
- 对于重复操作，考虑使用循环结构

### 4. 测试策略
- **冒烟测试**: 创建核心功能的快速验证流程
- **回归测试**: 针对关键业务流程的完整测试
- **边界测试**: 测试异常情况和错误处理

## 🔄 版本更新

### 当前版本特性
- ✅ 条件分支支持
- ✅ 多AI模型支持
- ✅ 可视化流程设计
- ✅ 实时执行反馈
- ✅ 代码自动生成

### 计划功能
- 🔄 流程模板库
- 🔄 批量测试执行
- 🔄 测试报告生成
- 🔄 云端流程同步

## 📞 技术支持

### 相关链接
- [MidsceneJS 官方文档](https://midscenejs.com/)
- [Playwright 文档](https://playwright.dev/)
- [ReactFlow 文档](https://reactflow.dev/)

### 问题反馈
如遇到问题，请提供以下信息：
1. 操作系统和浏览器版本
2. 错误日志和截图
3. 复现步骤
4. 当前配置文件内容

---

**MidsceneJS 可视化设计器** - 让Web自动化测试变得简单而强大！ 🚀