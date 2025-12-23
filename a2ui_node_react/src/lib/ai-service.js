/**
 * 混元 AI 服务
 * 封装腾讯混元大模型 API 调用
 */
class AIService {
  constructor() {
    this.config = {
      apiKey: process.env.HUNYUAN_API_KEY,
      baseURL: process.env.HUNYUAN_BASE_URL || 'http://hunyuanapi.woa.com/openapi/v1',
      model: process.env.AI_MODEL || 'hunyuan-turbo',
      temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.3,
      maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 2048,
      topP: parseFloat(process.env.AI_TOP_P) || 0.95,
    };

    if (!this.config.apiKey) {
      throw new Error('HUNYUAN_API_KEY is required');
    }

    console.log('🤖 AI Service 初始化:', {
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });
  }

  /**
   * 生成内容（使用系统提示词+用户提示词）
   * @param {object} prompts - { system: string, user: string }
   * @returns {Promise<string>} AI 生成的内容
   */
  async generateContent(prompts) {
    const startTime = Date.now();
    
    if (!prompts.system || !prompts.user) {
      throw new Error('Invalid prompt format. Expected {system, user}');
    }

    const messages = [
      { role: 'system', content: prompts.system },
      { role: 'user', content: prompts.user },
    ];

    console.log('📤 发送请求到混元 API:', {
      model: this.config.model,
      systemLength: prompts.system.length,
      userLength: prompts.user.length,
    });

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          top_p: this.config.topP,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 混元 API 错误:', response.status, errorData);
        throw new Error(`混元 API 错误 (${response.status}): ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      if (!data?.choices?.[0]?.message?.content) {
        console.error('❌ 混元 API 返回格式错误:', data);
        throw new Error('混元 API 返回格式错误');
      }

      const duration = Date.now() - startTime;
      const content = data.choices[0].message.content;
      
      console.log('✅ 混元 API 响应成功:', {
        duration: `${duration}ms`,
        contentLength: content.length,
        usage: data.usage,
      });

      return content;
    } catch (error) {
      console.error('❌ 混元 API 调用失败:', error.message);
      if (error.message.includes('混元 API')) {
        throw error;
      }
      throw new Error(`混元 API 调用失败: ${error.message}`);
    }
  }
}

let aiServiceInstance = null;

/**
 * 获取 AI 服务单例
 * @returns {AIService}
 */
export function getAIService() {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}
