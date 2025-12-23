/**
 * A2UI Agent - CopilotKit 集成
 * 基于 @ag-ui/client 的 AbstractAgent，处理用户消息并生成 A2UI 界面
 * 使用 RxJS Observable 实现流式响应
 */
import { getAIService } from './ai-service';
import { buildA2UIPrompt } from './a2ui-spec';
import { validateA2UIResponse } from './a2ui-validator';
import { Observable } from 'rxjs';
import { AbstractAgent } from '@ag-ui/client';

const MAX_RETRIES = 2;

export class A2UIAgent extends AbstractAgent {
  constructor(config = {}) {
    super({
      agentId: config.agentId || 'a2ui-agent',
      description:
        config.description ||
        'AI-powered UI generation agent using A2UI protocol with TDesign components',
      threadId: config.threadId,
      initialMessages: config.initialMessages || [],
      initialState: config.initialState || {},
      debug: config.debug || false,
    });
    this.aiService = getAIService();
  }

  clone() {
    return new A2UIAgent({
      agentId: this.agentId,
      description: this.description,
      threadId: this.threadId,
      initialMessages: [...this.messages],
      initialState: { ...this.state },
      debug: this.debug,
    });
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 发送文本消息（复用逻辑）
   */
  emitTextMessage(observer, messageId, text) {
    observer.next({ type: 'TEXT_MESSAGE_START', messageId, role: 'assistant' });
    observer.next({ type: 'TEXT_MESSAGE_CONTENT', messageId, delta: text });
    observer.next({ type: 'TEXT_MESSAGE_END', messageId });
  }

  /**
   * 运行 Agent（CopilotKit 调用入口）
   * @param {object} input - { messages, runId, threadId }
   * @returns {Observable} RxJS Observable 流
   */
  run(input) {
    return new Observable(observer => {
      (async () => {
        try {
          const { messages, runId, threadId } = input;
          console.log('🚀 Agent 开始运行:', {
            runId,
            threadId,
            messageCount: messages?.length,
          });

          observer.next({ type: 'RUN_STARTED', runId, threadId });

          const lastMessage = messages?.[messages.length - 1];
          const userInput =
            typeof lastMessage?.content === 'string'
              ? lastMessage.content.trim()
              : '';

          if (!userInput) {
            console.warn('⚠️ 收到空消息');
            this.emitTextMessage(
              observer,
              this.generateMessageId(),
              messages?.length ? '消息内容为空' : '请发送消息'
            );
            observer.next({ type: 'RUN_FINISHED', runId, threadId });
            observer.complete();
            return;
          }

          console.log('📝 用户输入:', userInput);
          const messageId = this.generateMessageId();
          const result = await this.processMessage(userInput);

          if (result.text) {
            this.emitTextMessage(observer, messageId, result.text);
          }

          // 发送 A2UI 组件
          if (result.a2ui?.components?.length) {
            console.log('🎨 发送 A2UI 组件:', result.a2ui.components.length);
            observer.next({
              type: 'ACTIVITY_SNAPSHOT',
              messageId: this.generateMessageId(),
              activityType: 'a2ui-surface',
              content: { operations: [result.a2ui] },
              replace: true,
            });
          }

          observer.next({ type: 'RUN_FINISHED', runId, threadId });
          observer.complete();
          console.log('✅ Agent 运行完成');
        } catch (error) {
          console.error('❌ Agent 运行错误:', error);
          observer.next({
            type: 'RUN_ERROR',
            message: `生成界面失败: ${error.message}`,
          });
          observer.error(error);
        }
      })();
    });
  }

  /**
   * 处理用户消息（核心逻辑）
   * 包含重试机制：JSON 解析失败或验证失败时自动重试
   */
  async processMessage(userMessage) {
    let currentQuery = userMessage;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        console.log(`🔄 第 ${attempt} 次尝试生成界面`);

        const prompt = buildA2UIPrompt(currentQuery);
        const responseText = await this.aiService.generateContent(prompt);
        const parsed = this.parseAIResponse(responseText);
        const validation = validateA2UIResponse(parsed);

        if (!validation.valid) {
          const errors = validation.errors
            .map(e => `${e.path || e.instancePath} ${e.message}`)
            .join(', ');
          console.warn('⚠️ A2UI 验证失败:', errors);

          if (attempt <= MAX_RETRIES) {
            currentQuery = this.buildRetryQuery(
              userMessage,
              `Validation errors: ${errors}`
            );
            lastError = new Error(`Validation failed: ${errors}`);
            continue;
          }
          throw new Error(`A2UI validation failed: ${errors}`);
        }

        console.log('✅ A2UI 生成成功');
        return {
          text: parsed.message || '已为您生成界面：',
          a2ui: parsed.a2ui,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error(`❌ 第 ${attempt} 次尝试失败:`, error.message);
        lastError = error;

        if (attempt <= MAX_RETRIES && error.name === 'SyntaxError') {
          currentQuery = this.buildRetryQuery(
            userMessage,
            `Invalid JSON format: ${error.message}`
          );
          continue;
        }
        if (attempt > MAX_RETRIES) break;
      }
    }

    throw new Error(lastError?.message || '生成界面失败，已达到最大重试次数');
  }

  /**
   * 构建重试查询（告诉 AI 上次出错的原因）
   */
  buildRetryQuery(originalMessage, errorInfo) {
    return `Your previous response had errors: ${errorInfo}\n\nPlease ensure:\n1. All strings are properly closed with double quotes\n2. No trailing commas\n3. All braces and brackets are properly closed\n4. Return ONLY the JSON object, no markdown code blocks\n5. Follow the A2UI JSON schema exactly\n\nOriginal request: "${originalMessage}"`;
  }

  /**
   * 解析 AI 响应（去除 markdown 代码块）
   */
  parseAIResponse(responseText) {
    const cleaned = responseText
      .trim()
      .replace(/^```json\s*/, '')
      .replace(/^```\s*/, '')
      .replace(/```\s*$/, '')
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (error) {
      console.warn('⚠️ JSON 解析失败，尝试修复常见错误');
      return {};
    }
  }
}
