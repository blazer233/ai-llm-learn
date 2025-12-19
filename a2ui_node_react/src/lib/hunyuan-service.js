import axios from 'axios';

/**
 * 混元 AI 服务类
 * 提供与 Gemini API 相同的接口，便于无缝切换
 */
export class HunyuanService {
  constructor(apiKey, baseURL, model = 'hunyuan-turbo') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.model = model;
    this.generationConfig = {};
  }

  /**
   * 设置生成配置
   */
  setGenerationConfig(config) {
    this.generationConfig = {
      temperature: config.temperature || 0.7,
      max_tokens: config.maxOutputTokens || 2048,
      top_p: config.topP || 0.95,
      // 混元不支持 top_k，忽略该参数
    };
  }

  /**
   * 生成内容 - 与 Gemini API 接口兼容
   * @param {string} prompt - 提示词
   * @returns {Promise<Object>} 返回格式化的响应对象
   */
  async generateContent(prompt) {
    try {
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        ...this.generationConfig,
      };

      console.log('\n========================================');
      console.log('🚀 [Hunyuan API 请求]');
      console.log('========================================');
      console.log('URL:', `${this.baseURL}/chat/completions`);
      console.log('Model:', this.model);
      console.log('Config:', JSON.stringify(this.generationConfig, null, 2));
      console.log('\n📝 完整请求体:');
      console.log(JSON.stringify(requestBody, null, 2));
      console.log('\n💬 Prompt 内容:');
      console.log(prompt.substring(0, 500) + (prompt.length > 500 ? '...' : ''));
      console.log('========================================\n');

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 60000, // 60 秒超时
        }
      );

      const result = response.data;

      console.log('\n========================================');
      console.log('✅ [Hunyuan API 响应]');
      console.log('========================================');
      console.log('Status:', response.status, response.statusText);
      console.log('\n📊 完整响应体:');
      console.log(JSON.stringify(result, null, 2));
      console.log('\n📈 Token 使用情况:');
      console.log('  - Prompt Tokens:', result.usage?.prompt_tokens || 0);
      console.log('  - Completion Tokens:', result.usage?.completion_tokens || 0);
      console.log('  - Total Tokens:', result.usage?.total_tokens || 0);
      console.log('========================================\n');

      // 检查响应格式
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        console.error('❌ [Hunyuan API 响应格式错误]', result);
        throw new Error('混元 API 返回格式不正确');
      }

      const messageContent = result.choices[0].message.content;

      console.log('💡 [生成内容预览]');
      console.log(messageContent.substring(0, 300) + (messageContent.length > 300 ? '...' : ''));
      console.log('');

      // 返回与 Gemini 兼容的格式
      return {
        response: {
          text: () => messageContent,
          usageMetadata: result.usage,
        },
      };
    } catch (error) {
      console.log('\n========================================');
      console.log('❌ [Hunyuan API 调用失败]');
      console.log('========================================');
      
      if (error.response) {
        console.log('HTTP Status:', error.response.status, error.response.statusText);
        console.log('\n错误响应体:');
        console.log(JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('错误信息:', error.message);
      }
      console.log('========================================\n');

      if (error.response) {
        const errorMsg = error.response.data?.error?.message || error.response.statusText;
        throw new Error(`混元 API 调用失败 (${error.response.status}): ${errorMsg}`);
      }

      throw new Error(`混元 API 调用失败: ${error.message}`);
    }
  }
}

/**
 * 创建混元客户端（与 GoogleGenerativeAI 接口兼容）
 */
export class HunyuanClient {
  constructor(apiKey, baseURL) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  /**
   * 获取生成模型（与 Gemini 接口兼容）
   */
  getGenerativeModel(config) {
    const service = new HunyuanService(
      this.apiKey,
      this.baseURL,
      config.model
    );

    if (config.generationConfig) {
      service.setGenerationConfig(config.generationConfig);
    }

    return service;
  }
}
