import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

/**
 * 评审员 Agent 配置
 */
const REVIEWER_CONFIG = {
  DEFAULT_MODEL: 'hunyuan-lite',
  DEFAULT_TEMPERATURE: 0.3,
  APPROVAL_KEYWORD: 'APPROVED',
  SYSTEM_PROMPT: `你是一位严谨的评审专家。你的任务是：
1. 仔细评审研究内容的质量
2. 检查逻辑性、完整性和准确性
3. 提供建设性的反馈意见
4. 判断内容是否达到发布标准

评审标准：
- 内容是否全面、深入
- 论证是否有逻辑性
- 结论是否有充分依据
- 语言表达是否清晰专业

如果内容符合标准，回复 "APPROVED: [简短评价]"
如果需要修改，回复 "REVISION_NEEDED: [具体修改建议]"`,
};

/**
 * 评审员 Agent - 负责评审和提供反馈
 */
export class ReviewerAgent {
  /**
   * 构造函数
   * @param {Object} config - 配置对象
   */
  constructor(config = {}) {
    this.name = 'Reviewer';
    this.model = this._initializeModel(config);
  }

  /**
   * 初始化模型
   * @private
   */
  _initializeModel(config) {
    return new ChatOpenAI({
      modelName: config.modelName || REVIEWER_CONFIG.DEFAULT_MODEL,
      temperature: config.temperature || REVIEWER_CONFIG.DEFAULT_TEMPERATURE,
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
   * 评审研究内容
   * @param {string} content - 待评审的研究内容
   * @returns {Promise<{approved: boolean, feedback: string}>} 评审结果
   */
  async review(content) {
    console.log(`\n[${this.name}] 开始评审研究内容...`);
    
    const messages = [
      new SystemMessage(REVIEWER_CONFIG.SYSTEM_PROMPT),
      new HumanMessage(
        `请评审以下研究内容：\n\n${content}\n\n` +
        `请根据评审标准给出你的评审意见。`
      ),
    ];

    const response = await this.model.invoke(messages);
    const feedback = response.content;
    const approved = this._isApproved(feedback);
    
    console.log(`[${this.name}] 评审结果: ${approved ? '通过' : '需要修改'}`);
    
    return { approved, feedback };
  }

  /**
   * 判断是否通过评审
   * @private
   */
  _isApproved(feedback) {
    return feedback.includes(REVIEWER_CONFIG.APPROVAL_KEYWORD);
  }
}
