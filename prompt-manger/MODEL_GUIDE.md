# 模型接入指南

本平台已集成真实的 AI 模型 API 调用功能。以下是各个模型的配置和使用说明。

## 支持的模型

### 1. 通义千问 (Qwen) - 阿里云

**状态**: ✅ 已集成

**获取 API Key**:
- 访问：https://dashscope.console.aliyun.com/apiKey
- 登录阿里云账号
- 创建并复制 API Key

**API 端点**:
- 兼容模式：`https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
- 使用 OpenAI 兼容的接口格式

**常用模型版本**:
- `qwen-turbo` - 快速响应版本
- `qwen-plus` - 平衡性能版本
- `qwen-max` - 最强性能版本
- `qwen-max-longcontext` - 长文本处理版本
- `qwen-long` - 超长文本版本

**API 文档**: https://help.aliyun.com/zh/dashscope/developer-reference/compatibility-of-openai-with-dashscope

---

### 2. DeepSeek

**状态**: ✅ 已集成

**获取 API Key**:
- 访问：https://platform.deepseek.com/api_keys
- 注册并登录 DeepSeek 账号
- 创建并复制 API Key

**常用模型版本**:
- `deepseek-chat` - 通用对话模型
- `deepseek-coder` - 代码生成模型

**API 文档**: https://platform.deepseek.com/api-docs/

---

### 3. Google Gemini

**状态**: ✅ 已集成

**获取 API Key**:
- 访问：https://makersuite.google.com/app/apikey
- 登录 Google 账号
- 创建并复制 API Key

**常用模型版本**:
- `gemini-pro` - 通用版本
- `gemini-pro-vision` - 支持图像的版本
- `gemini-1.5-pro` - 1.5 专业版
- `gemini-1.5-flash` - 1.5 快速版

**API 文档**: https://ai.google.dev/docs

---

### 4. 腾讯混元 (Hunyuan)

**状态**: ⚠️ 需要配置

**说明**: 腾讯混元使用腾讯云 SDK，需要额外配置。

**配置步骤**:
1. 安装腾讯云 SDK：
   ```bash
   npm install tencentcloud-sdk-nodejs
   ```

2. 获取密钥：
   - 访问：https://console.cloud.tencent.com/cam/capi
   - 获取 SecretId 和 SecretKey

3. 修改 `/app/api/prompts/test/route.ts` 中的 `callHunyuan` 函数

**API 文档**: https://cloud.tencent.com/document/product/1729

---

## 使用流程

### 1. 配置 API Key

在提示词详情页面，点击右上角 **"API Key 管理"** 按钮：
- 输入对应模型的 API Key
- 点击 **"保存"** 按钮
- API Key 将保存在浏览器本地存储中

### 2. 在线测试

在 **"在线测试"** 标签页：
1. **选择模型** - 选择要使用的 AI 模型
2. **输入模型版本** - 填写具体的模型版本（如 qwen-turbo）
3. **API Key** - 自动加载已保存的 Key，或手动输入
4. **测试内容** - 输入要测试的内容
5. **开始测试** - 点击按钮，等待 AI 响应

### 3. 查看结果

测试结果会实时显示在右侧的 **"测试结果"** 面板中。

---

## API 调用流程

```
前端 (React)
    ↓ POST /api/prompts/test
后端 API Route
    ↓ 根据模型类型调用对应函数
AI 模型 API (Qwen/DeepSeek/Gemini/Hunyuan)
    ↓ 返回生成结果
后端处理响应
    ↓ 返回给前端
前端展示结果
```

---

## 常见问题

### 1. API Key 无效
- 检查 API Key 是否正确复制
- 确认 API Key 是否已激活
- 检查账户余额是否充足

### 2. 模型版本错误
- 确认输入的模型版本是否正确
- 参考各模型的官方文档获取准确的版本名称

### 3. 超时或网络错误
- 检查网络连接
- 某些模型可能需要科学上网
- 确认 API 服务是否正常运行

### 4. 腾讯混元无法使用
- 腾讯混元需要额外的 SDK 配置
- 请参考上述配置步骤
- 或联系管理员协助配置

---

## 安全提示

- ⚠️ API Key 仅保存在浏览器本地，不会上传到服务器
- ⚠️ 请勿在公共环境中使用或分享 API Key
- ⚠️ 定期更换 API Key 以确保安全
- ⚠️ 注意 API 调用费用，避免过度使用

---

## 技术支持

如有问题，请参考：
- 阿里云通义千问：https://help.aliyun.com/zh/dashscope/
- DeepSeek：https://platform.deepseek.com/api-docs/
- Google Gemini：https://ai.google.dev/docs
- 腾讯混元：https://cloud.tencent.com/document/product/1729
