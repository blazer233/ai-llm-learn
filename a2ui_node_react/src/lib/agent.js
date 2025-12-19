import { HunyuanClient } from './hunyuan-service.js';
import { buildA2UIPrompt } from './a2ui-spec.js';
import {
  validateA2UIResponse,
  formatValidationErrors,
} from './a2ui-validator.js';

export class A2UIAgent {
  constructor() {
    const apiKey = process.env.HUNYUAN_API_KEY;
    const baseURL =
      process.env.HUNYUAN_BASE_URL || 'http://hunyuanapi.woa.com/openapi/v1';
    const modelName = process.env.AI_MODEL || 'hunyuan-turbo';

    if (!apiKey) {
      throw new Error('HUNYUAN_API_KEY not found in environment variables');
    }

    // 从环境变量读取模型配置
    const temperature = parseFloat(process.env.AI_TEMPERATURE || '0.3');
    const maxTokens = parseInt(process.env.AI_MAX_TOKENS || '2048', 10);
    const topP = parseFloat(process.env.AI_TOP_P || '0.95');

    // 配置生成参数
    this.generationConfig = {
      temperature,
      maxOutputTokens: maxTokens,
      topP,
    };

    this.genAI = new HunyuanClient(apiKey, baseURL);
    this.model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: this.generationConfig,
    });

    // 重试配置
    this.maxRetries = 1; // 总共 2 次尝试

    console.log(`🤖 A2UI Agent initialized with Hunyuan model: ${modelName}`);
    console.log(`🌐 Base URL: ${baseURL}`);
    console.log(`📊 Generation config:`, this.generationConfig);
    console.log(`🔄 Max retries: ${this.maxRetries}`);
  }

  async processMessage(userMessage) {
    let attempt = 0;
    let lastError = null;
    let currentQuery = userMessage;

    while (attempt <= this.maxRetries) {
      attempt++;
      console.log(
        `🔄 Attempt ${attempt}/${this.maxRetries + 1} for: "${userMessage}"`
      );

      try {
        // 使用 AI 动态生成 A2UI 组件
        const prompt = this.buildA2UIPrompt(currentQuery);
        console.log(`\n🔨 构建 Prompt，长度: ${prompt.length} 字符`);

        const result = await this.model.generateContent(prompt);
        const response = result.response;
        const responseText = response.text();

        console.log(`📥 收到响应，长度: ${responseText.length} 字符`);
        console.log(`📄 响应预览:\n${responseText}`);

        // 解析 AI 返回的 JSON
        let parsed;
        try {
          console.log('🔍 解析 JSON...');
          parsed = this.parseAIResponse(responseText);
          console.log('✅ JSON 解析成功');
          console.log(`   message: ${parsed.message || '(无)'}...`);
          console.log(`   a2ui: ${parsed.a2ui ? 'Present' : 'Missing'}`);
        } catch (parseError) {
          // JSON 解析失败
          console.error(
            `❌ JSON parse error on attempt ${attempt}:`,
            parseError.message
          );
          lastError = parseError.message;

          if (attempt <= this.maxRetries) {
            // 准备重试，要求 AI 返回有效的 JSON
            currentQuery = `Your previous response had invalid JSON format: ${parseError.message}
Please ensure you return a valid JSON object with this exact structure:
{
  "message": "your message to user",
  "a2ui": { /* TDesign component structure */ }
}

Make sure:
1. All strings are properly closed with double quotes
2. No trailing commas
3. All braces and brackets are properly closed
4. Use valid JSON escape sequences

Original request: "${userMessage}"`;
            continue; // 重试
          } else {
            throw parseError; // 最后一次尝试失败，抛出错误
          }
        }

        // 验证 JSON 格式
        const validation = validateA2UIResponse(parsed);

        if (validation.valid) {
          console.log(`✅ Valid response received on attempt ${attempt}`);
          return {
            text: parsed.message || '好的，我已为您准备了界面：',
            a2ui: parsed.a2ui,
            timestamp: Date.now(),
            attempts: attempt,
          };
        } else {
          // 验证失败
          const errorMsg = formatValidationErrors(validation.errors);
          console.warn(
            `⚠️ Validation failed on attempt ${attempt}: ${errorMsg}`
          );
          lastError = errorMsg;

          if (attempt <= this.maxRetries) {
            // 准备重试，修改 query 提示 AI 修正错误
            currentQuery = `Your previous response was invalid. Validation errors: ${errorMsg}
Please ensure the response follows the A2UI JSON schema exactly.
Original request: "${userMessage}"`;
            continue; // 重试
          }
        }
      } catch (error) {
        console.error(`❌ Error on attempt ${attempt}:`, error);
        lastError = error.message;

        if (attempt <= this.maxRetries) {
          console.warn(`⚠️ Retrying after error...`);
          continue; // 重试
        }
      }
    }

    // 重试耗尽，抛出错误而不是返回降级响应
    console.error(`❌ Max retries exhausted. Last error: ${lastError}`);
    throw new Error(lastError || '生成界面失败，请稍后重试');
  }

  buildA2UIPrompt(userMessage) {
    return buildA2UIPrompt(userMessage);
  }

  parseAIResponse(responseText) {
    try {
      // 尝试提取 JSON（处理可能的 markdown 代码块）
      let jsonStr = responseText.trim();

      // 移除 markdown 代码块标记
      jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      jsonStr = jsonStr.replace(/^```\s*/i, '').replace(/\s*```$/, '');

      const parsed = JSON.parse(jsonStr);

      return {
        message: parsed.message || '',
        a2ui: parsed.a2ui || null,
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Raw response:', responseText.slice(0, 500));

      // 解析失败，抛出明确的错误
      throw new Error(`AI 返回了无效的 JSON 格式: ${error.message}`);
    }
  }
}
