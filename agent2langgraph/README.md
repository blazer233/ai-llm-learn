# Agent2LangGraph - 双 Agent 协作系统

基于 LangGraph.js 和腾讯混元大模型实现的双 Agent 协作系统，展示了研究员和评审员两个 AI Agent 之间的协作流程。

## 📋 项目简介

本项目实现了一个完整的研究-评审工作流，**使用腾讯混元大模型**：

1. **研究员 Agent** - 负责研究给定主题并生成研究报告
2. **评审员 Agent** - 负责评审研究内容并提供反馈
3. **LangGraph 工作流** - 协调两个 Agent 的交互，支持迭代优化
4. **React Flow 可视化** - 交互式工作流图形展示

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────┐
│          LangGraph Workflow                 │
│                                             │
│  ┌──────────┐    ┌──────────┐    ┌───────┐ │
│  │ Research │───▶│  Review  │───▶│ END   │ │
│  └──────────┘    └──────────┘    └───────┘ │
│       │               │                     │
│       │               ▼                     │
│       │          approved?                  │
│       │               │                     │
│       │               ▼ No                  │
│       │          ┌──────────┐              │
│       └──────────│  Revise  │              │
│                  └──────────┘              │
└─────────────────────────────────────────────┘
```

## 🎨 工作流可视化

### 启动可视化界面

```bash
cd visualizer
./start.sh
# 或者
npm install && npm run dev
```

访问 `http://localhost:5173` 查看交互式工作流图：

**可视化功能特性：**
- ✅ 拖拽、缩放、移动节点
- ✅ 自定义节点样式（起始、处理、结束）
- ✅ 条件边高亮显示
- ✅ 动画展示数据流
- ✅ 迷你地图导航
- ✅ 实时状态同步（扩展功能）

详见 [visualizer/README.md](./visualizer/README.md)

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境

复制 `.env.example` 为 `.env` 并配置混元 API:

```bash
cp .env.example .env
```

编辑 `.env` 文件:

```env
HUNYUAN_API_KEY=your_api_key_here
HUNYUAN_BASE_URL=http://hunyuanapi.woa.com/openapi/v1
HUNYUAN_MODEL=hunyuan-lite
```

### 3. 运行示例

```bash
# 使用默认主题
npm start

# 指定自定义主题
npm start "人工智能在医疗领域的应用"
```

## 📁 项目结构

```
agent2langgraph/
├── agents/
│   ├── researcher.js    # 研究员 Agent
│   └── reviewer.js      # 评审员 Agent
├── visualizer/          # React Flow 可视化
│   ├── src/
│   │   ├── App.jsx
│   │   ├── workflowData.js
│   │   └── components/
│   │       └── CustomNode.jsx
│   ├── package.json
│   └── README.md
├── workflow.js          # LangGraph 工作流定义
├── index.js             # 主入口文件
├── package.json
├── .env.example
└── README.md
```

## 🔧 核心组件

### ResearcherAgent (研究员)

负责研究主题并生成内容:

```javascript
const researcher = new ResearcherAgent(config);

// 研究主题
const research = await researcher.research(topic);

// 根据反馈修改
const revised = await researcher.revise(originalResearch, feedback);
```

### ReviewerAgent (评审员)

负责评审研究内容:

```javascript
const reviewer = new ReviewerAgent(config);

// 评审内容
const { approved, feedback } = await reviewer.review(content);
```

### ResearchReviewWorkflow (工作流)

使用 LangGraph 协调 Agent 交互:

```javascript
const workflow = new ResearchReviewWorkflow(config);
const result = await workflow.execute(topic);
```

## 🔄 工作流程

1. **研究阶段**: 研究员 Agent 分析主题并生成初始研究内容
2. **评审阶段**: 评审员 Agent 检查内容质量并给出反馈
3. **决策阶段**: 
   - 如果通过评审 → 结束流程
   - 如果需要修改 → 进入修改阶段
   - 如果达到最大迭代次数 → 结束流程
4. **修改阶段**: 研究员根据反馈修改内容
5. **重复评审**: 返回步骤 2

## ⚙️ 配置选项

```javascript
const config = {
  apiKey: 'your-api-key',                           // 混元 API Key
  baseURL: 'http://hunyuanapi.woa.com/openapi/v1',  // 混元 API 地址
  modelName: 'hunyuan-lite',                        // 使用的模型
  temperature: 0.7,                                  // 温度参数
  maxIterations: 3,                                  // 最大迭代次数
};
```

### 支持的模型

混元提供多种模型：

- **hunyuan-lite** - 轻量级模型，速度快（推荐）
- **hunyuan-standard** - 标准模型，平衡性能
- **hunyuan-pro** - 专业模型，效果最好

## 📝 使用示例

### 基础使用

```javascript
import { ResearchReviewWorkflow } from './workflow.js';

const workflow = new ResearchReviewWorkflow({
  apiKey: process.env.HUNYUAN_API_KEY,
  baseURL: 'http://hunyuanapi.woa.com/openapi/v1',
  modelName: 'hunyuan-lite',
  maxIterations: 3,
});

const result = await workflow.execute('区块链技术的发展趋势');
console.log(result.research);
```

### 自定义 Agent

```javascript
import { ResearcherAgent } from './agents/researcher.js';

const researcher = new ResearcherAgent({
  apiKey: 'your-api-key',
  modelName: 'hunyuan-standard',
  temperature: 0.5,
  baseURL: 'http://hunyuanapi.woa.com/openapi/v1',
});

const analysis = await researcher.research('量子计算');
```

## 🎯 特性

- ✅ 完整的双 Agent 协作系统
- ✅ 基于 LangGraph.js 的工作流编排
- ✅ **使用腾讯混元大模型，中文能力强**
- ✅ **OpenAI 兼容接口，易于集成**
- ✅ 支持迭代优化和反馈循环
- ✅ 可配置的迭代次数和模型参数
- ✅ 清晰的日志输出和状态跟踪
- ✅ 遵循 JavaScript/TypeScript 编码规范

## 🛠️ 技术栈

- **LangGraph.js** - 工作流编排
- **LangChain** - AI Agent 框架
- **腾讯混元** - 大语言模型
- **Node.js** - 运行环境

## 📚 扩展建议

1. **添加更多 Agent**: 可以添加编辑、校对等其他角色
2. **持久化状态**: 使用数据库保存工作流状态
3. **流式输出**: 实现实时的流式响应
4. **Web 界面**: 添加可视化的操作界面
5. **工具集成**: 为 Agent 添加搜索、计算等工具
6. **多模型支持**: 不同 Agent 使用不同的专业模型

## ⚠️ 注意事项

1. **API Key**: 确保正确配置混元 API Key
2. **网络访问**: 确保可以访问混元 API 地址
3. **速率限制**: 注意 API 的调用频率限制
4. **模型选择**: 根据任务复杂度选择合适的模型

## 🐛 故障排查

### API 连接失败

```bash
# 检查网络连接
curl http://hunyuanapi.woa.com/openapi/v1/models

# 检查 API Key 是否正确
echo $HUNYUAN_API_KEY
```

### 权限问题

确保你有访问混元 API 的权限，联系管理员获取 API Key。

## 📄 许可

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
