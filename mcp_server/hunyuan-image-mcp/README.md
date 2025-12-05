# Hunyuan Image MCP Server

基于 Node.js 实现的混元图片生成 MCP (Model Context Protocol) 服务器。支持通过混元 API 生成高质量图片，可与 Claude Desktop、Cursor 等 MCP 客户端集成。

## 功能特性

- ✅ **图片生成**：根据文本描述生成高质量图片
- ✅ **参数丰富**：支持自定义尺寸、步数、引导系数、随机种子等
- ✅ **风格控制**：支持指定生成风格（写实、动漫、水彩等）
- ✅ **负面提示**：支持负面提示词排除不想要的元素
- ✅ **异步支持**：支持异步任务查询
- ✅ **本地保存**：自动保存生成的图片到本地

## 安装

### 1. 安装依赖

```bash
cd /Users/songyanchao/Desktop/thing/zhishi/mcp_server/hunyuan-image-mcp
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的 API Key：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
HUNYUAN_API_KEY=your_api_key_here
HUNYUAN_BASE_URL=http://hunyuanapi.woa.com/openapi/v1
```

## 使用方法

### 方式一：使用 MCP Inspector 测试（推荐）

MCP Inspector 提供了一个可视化的 Web 界面来测试 MCP Server：

```bash
npm run inspector
```

或者：

```bash
./start-inspector.sh
```

启动后会自动打开浏览器，访问 Inspector Web 界面（通常在 http://localhost:5173）。

在 Inspector 中你可以：
- 🔧 查看所有可用的工具
- 🧪 测试工具调用
- 📊 查看请求和响应
- 🐛 调试错误

详细使用指南请查看 [INSPECTOR_GUIDE.md](./INSPECTOR_GUIDE.md)

### 方式二：独立运行（测试用）

```bash
npm start
```

或运行测试脚本：

```bash
npm test
```

### 方式三：集成到 Claude Desktop

1. 编辑 Claude Desktop 配置文件：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. 添加 MCP 服务器配置：

```json
{
  "mcpServers": {
    "hunyuan-image": {
      "command": "node",
      "args": [
        "/Users/songyanchao/Desktop/thing/zhishi/mcp_server/hunyuan-image-mcp/index.js"
      ]
    }
  }
}
```

3. 重启 Claude Desktop

### 方式四：集成到 Cursor

1. 编辑 Cursor MCP 配置文件：

**macOS/Linux**: `~/.cursor/mcp_settings.json`

**Windows**: `%USERPROFILE%\.cursor\mcp_settings.json`

2. 添加配置：

```json
{
  "mcpServers": {
    "hunyuan-image": {
      "command": "node",
      "args": [
        "/Users/songyanchao/Desktop/thing/zhishi/mcp_server/hunyuan-image-mcp/index.js"
      ]
    }
  }
}
```

3. 重启 Cursor

## 工具说明

### generate_image - 生成图片

根据文本描述生成图片。

**参数**：

- `prompt` (必填): 图片描述文本
- `negative_prompt` (可选): 负面提示词
- `width` (可选): 图片宽度，默认 1024
- `height` (可选): 图片高度，默认 1024
- `steps` (可选): 推理步数，默认 20，范围 1-50
- `guidance_scale` (可选): CFG 引导系数，默认 7.5，范围 1-20
- `seed` (可选): 随机种子，用于复现结果
- `style` (可选): 图片风格，如：写实、动漫、水彩、油画等

**使用示例**：

```
帮我生成一张图片：夕阳下的海边，有一个女孩在散步，动漫风格
```

### query_image_task - 查询任务

查询异步图片生成任务的状态和结果。

**参数**：

- `task_id` (必填): 任务 ID

## 目录结构

```
hunyuan-image-mcp/
├── index.js              # MCP 服务器主文件
├── service.js            # 混元 API 服务封装
├── package.json          # 项目配置
├── .env                  # 环境变量配置（不提交）
├── .env.example          # 环境变量示例
├── .gitignore           # Git 忽略文件
├── README.md            # 项目文档
└── generated_images/    # 生成的图片保存目录
```

## API 参数说明

### 图片尺寸

常用尺寸组合：
- 正方形：512x512, 768x768, 1024x1024
- 横向：1024x768, 1280x720
- 纵向：768x1024, 720x1280

### 推理步数 (steps)

- 范围：1-50
- 推荐：20-30
- 步数越多，图片质量越高，但生成时间越长

### 引导系数 (guidance_scale)

- 范围：1-20
- 推荐：7-10
- 值越大，生成结果越符合提示词，但可能降低多样性
- 值越小，生成结果更随机，创意性更强

### 随机种子 (seed)

- 使用相同的种子和参数可以生成相同的图片
- 用于复现满意的结果

## 常见问题

### Q: 如何提高图片质量？

A: 可以通过以下方式：
1. 增加推理步数（如设为 30-50）
2. 使用更详细的提示词
3. 添加质量相关的关键词，如"高清"、"细节丰富"等

### Q: 图片生成失败怎么办？

A: 请检查：
1. API Key 是否正确
2. 网络连接是否正常
3. 提示词是否符合规范（避免敏感内容）
4. 参数是否在有效范围内

### Q: 如何控制图片风格？

A: 可以通过以下方式：
1. 使用 `style` 参数指定风格
2. 在 `prompt` 中添加风格描述词
3. 参考其他优秀作品的提示词

### Q: 生成的图片保存在哪里？

A: 图片自动保存在 `generated_images/` 目录下，文件名包含时间戳和提示词。

## 技术栈

- **Node.js**: JavaScript 运行时
- **@modelcontextprotocol/sdk**: MCP 协议实现
- **axios**: HTTP 客户端
- **dotenv**: 环境变量管理

## 开发说明

### 日志调试

服务器日志输出到 stderr，不影响 MCP 协议通信：

```javascript
console.error('[调试信息]', data);  // 输出到 stderr
```

### 错误处理

所有错误都会被捕获并返回给客户端：

```json
{
  "content": [{
    "type": "text",
    "text": "错误: 具体错误信息"
  }],
  "isError": true
}
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0 (2025-12-04)

- ✨ 初始版本发布
- ✨ 支持图片生成
- ✨ 支持异步任务查询
- ✨ 支持图片本地保存
