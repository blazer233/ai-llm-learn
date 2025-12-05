import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

/**
 * 研究员 Agent 配置
 */
const RESEARCHER_CONFIG = {
  DEFAULT_MODEL: 'hunyuan-lite',
  DEFAULT_TEMPERATURE: 0.7,
  SYSTEM_PROMPT: `你是一位专业的研究员。你的任务是：
1. 深入研究给定的主题
2. 提供详细的分析和见解
3. 给出有根据的结论
4. 用清晰、专业的语言表达

请保持客观、严谨的研究态度。`,
};

/**
 * 研究员 Agent - 负责研究和分析主题
 */
export class ResearcherAgent {
  /**
   * 构造函数
   * @param {Object} config - 配置对象
   */
  constructor(config = {}) {
    this.name = 'Researcher';
    this.model = this._initializeModel(config);
  }

  /**
   * 初始化模型
   * @private
   */
  _initializeModel(config) {
    return new ChatOpenAI({
      modelName: config.modelName || RESEARCHER_CONFIG.DEFAULT_MODEL,
      temperature: config.temperature || RESEARCHER_CONFIG.DEFAULT_TEMPERATURE,
      openAIApiKey: config.apiKey || 'dummy-key',
      configuration: {
        baseURL: config.baseURL || 'http://hunyuanapi.woa.com/openapi/v1',
      },
      modelKwargs: {
        presence_penalty: undefined,
        frequency_penalty: undefined,
      },
    });
  }

  /**
   * 执行研究任务
   * @param {string} topic - 研究主题
   * @returns {Promise<string>} 研究结果
   */
  async research(topic) {
    console.log(`\n[${this.name}] 开始研究主题: ${topic}`);
    
    const messages = [
      new SystemMessage(RESEARCHER_CONFIG.SYSTEM_PROMPT),
      new HumanMessage(`请研究以下主题并提供详细分析：${topic}`),
    ];

    const response = await this.model.invoke(messages);
    
    console.log(`[${this.name}] 研究完成`);
    return response.content;
  }

  /**
   * 根据反馈修改研究内容
   * @param {string} originalResearch - 原始研究内容
   * @param {string} feedback - 评审反馈
   * @returns {Promise<string>} 修改后的研究内容
   */
  async revise(originalResearch, feedback) {
    console.log(`\n[${this.name}] 根据反馈进行修改...`);
    
    const messages = [
      new SystemMessage(RESEARCHER_CONFIG.SYSTEM_PROMPT),
      new HumanMessage(
        `原始研究内容：\n${originalResearch}\n\n` +
        `评审反馈：\n${feedback}\n\n` +
        `请根据评审反馈修改和完善研究内容。`
      ),
    ];

    const response = await this.model.invoke(messages);
    
    console.log(`[${this.name}] 修改完成`);
    return response.content;
  }
}
