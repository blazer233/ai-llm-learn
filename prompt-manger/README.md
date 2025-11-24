# 提示词管理平台

专业的 AI 提示词管理和测试工具，像 Postman 一样管理你的 AI 提示词。

## 功能特性

### 核心功能
- ✅ **场景化管理** - 按场景组织提示词和函数，支持多层级分类
- ✅ **提示词 CRUD** - 完整的提示词增删改查功能
- ✅ **函数模板库** - 管理纯函数代码模板，支持多语言（TypeScript、Python、Java 等）
- ✅ **版本控制** - 自动记录提示词和函数代码变更历史
- 🚧 **多模型测试** - 支持 OpenAI、Claude 等多种模型（前端已实现，需配置 API）
- 📊 **数据统计** - 提示词和函数使用统计和效果分析

### 技术栈
- **前端**: Next.js 16 + React 19 + TypeScript
- **UI 组件**: TDesign React
- **数据库**: MySQL + Prisma ORM
- **样式**: Tailwind CSS

## 快速开始

### 1. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 2. 配置环境变量

复制 \`.env.example\` 到 \`.env\` 并修改配置：

\`\`\`bash
cp .env.example .env
\`\`\`

编辑 \`.env\` 文件：

\`\`\`env
# 数据库配置
DATABASE_URL="mysql://用户名:密码@localhost:3306/数据库名"
\`\`\`

### 3. 初始化数据库

\`\`\`bash
# 生成 Prisma Client
npx prisma generate

# 创建数据库表
npx prisma db push

# 初始化默认用户
npm run db:init
\`\`\`

### 4. 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

\`\`\`
prompt-manager/
├── app/                      # Next.js 应用目录
│   ├── api/                  # API 路由
│   │   ├── scenes/          # 场景管理 API
│   │   └── prompts/         # 提示词管理 API
│   ├── dashboard/           # 仪表板页面
│   │   ├── scenes/          # 场景管理页面
│   │   ├── prompts/         # 提示词管理页面
│   │   └── settings/        # 设置页面
│   └── page.tsx             # 首页
├── components/              # React 组件
│   └── DashboardLayout.tsx  # 仪表板布局组件
├── lib/                     # 工具函数
│   └── prisma.ts           # Prisma 客户端
├── prisma/                  # Prisma 配置
│   └── schema.prisma       # 数据库模型
├── scripts/                 # 脚本文件
│   └── init-db.ts          # 数据库初始化脚本
└── types/                   # TypeScript 类型定义
    └── index.ts
\`\`\`

## 数据库模型

### User (用户)
- 基本信息：邮箱、用户名、密码、头像
- 关联：场景、提示词、函数模板

### Scene (场景)
- 场景信息：名称、描述、颜色、图标
- 关联：用户、提示词、函数模板

### Prompt (提示词)
- 基本信息：标题、内容、描述
- 参数配置：推荐模型、温度、最大 Token
- 统计信息：浏览次数、点赞次数
- 关联：用户、场景、测试记录

### FunctionTemplate (函数模板) 🆕
- 基本信息：函数名、代码、描述
- 语言配置：编程语言、分类、标签
- 参数定义：参数列表、返回类型
- 使用示例：示例代码数组
- 统计信息：浏览次数、点赞次数、使用次数
- 关联：用户、场景、版本

### FunctionTemplateVersion (函数版本) 🆕
- 版本信息：版本号、代码、变更日志
- 关联：函数模板

### TestRecord (测试记录)
- 测试信息：模型、输入、输出
- 性能数据：响应时间、Token 消耗
- 评价：评分、备注
- 关联：提示词

## API 文档

### 场景 API

#### GET /api/scenes
获取场景列表

#### POST /api/scenes
创建场景

#### GET /api/scenes/[id]
获取场景详情

#### PUT /api/scenes/[id]
更新场景

#### DELETE /api/scenes/[id]
删除场景

### 提示词 API

#### GET /api/prompts
获取提示词列表（可按场景筛选）

#### POST /api/prompts
创建提示词

#### GET /api/prompts/[id]
获取提示词详情

#### PUT /api/prompts/[id]
更新提示词

#### DELETE /api/prompts/[id]
删除提示词

### 函数模板 API 🆕

#### GET /api/functions
获取函数列表（可按场景、语言、分类筛选）

#### POST /api/functions
创建函数模板

#### GET /api/functions/[id]
获取函数详情

#### PUT /api/functions/[id]
更新函数模板（自动创建版本）

#### DELETE /api/functions/[id]
删除函数模板

## 待实现功能

### AI 模型对接
1. 在 \`.env\` 中配置 API 密钥：
   \`\`\`env
   OPENAI_API_KEY="sk-..."
   CLAUDE_API_KEY="sk-ant-..."
   \`\`\`

2. 创建 \`/api/prompts/test\` 接口实现真实的 AI 调用

3. 参考实现：
   \`\`\`typescript
   // app/api/prompts/test/route.ts
   import OpenAI from 'openai';
   
   export async function POST(request: Request) {
     const { promptId, model, input } = await request.json();
     
     const openai = new OpenAI({
       apiKey: process.env.OPENAI_API_KEY,
     });
     
     const response = await openai.chat.completions.create({
       model: model,
       messages: [{ role: 'user', content: input }],
     });
     
     // 保存测试记录到数据库
     // ...
     
     return NextResponse.json({ output: response.choices[0].message.content });
   }
   \`\`\`

### 其他功能
- [ ] 提示词模板市场
- [ ] 数据导入导出
- [ ] 提示词效果对比分析
- [ ] AI 辅助优化提示词
- [ ] Webhook 集成
- [ ] 用户认证系统（如需多用户支持）

## 部署

### Vercel 部署
1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署

### Docker 部署
\`\`\`bash
# 构建镜像
docker build -t prompt-manager .

# 运行容器
docker run -p 3000:3000 prompt-manager
\`\`\`

## 重要说明

**当前版本已移除用户认证系统**，所有数据存储在默认用户下。这适合以下场景：
- 个人使用
- 团队内网部署（通过网络层面控制访问）
- 快速原型验证

如需多用户支持和认证功能，可以：
1. 参考 Git 历史恢复认证相关代码
2. 集成第三方认证服务（如 NextAuth.js）
3. 实现自定义认证系统

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
