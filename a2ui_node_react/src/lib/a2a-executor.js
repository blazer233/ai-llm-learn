import { A2UIAgent } from './agent.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * A2UI Executor - 符合 @a2a-js/sdk AgentExecutor 接口
 * 将 A2UIAgent 封装为标准的 A2A 执行器
 */
export class A2UIExecutor {
  constructor() {
    this.a2uiAgent = new A2UIAgent();
    console.log('🤖 A2UIExecutor initialized (using @a2a-js/sdk interface)');
  }

  /**
   * 执行用户请求，生成 A2UI 界面
   * 符合 @a2a-js/sdk 的 AgentExecutor.execute() 接口
   * @param {import('@a2a-js/sdk/server').RequestContext} requestContext - A2A 请求上下文
   * @param {import('@a2a-js/sdk/server').ExecutionEventBus} eventBus - 事件总线
   */
  async execute(requestContext, eventBus) {
    try {
      console.log('📨 Processing A2A request:', {
        contextId: requestContext.contextId,
        userId: requestContext.user?.id,
        taskId: requestContext.taskId
      });

      // 提取用户消息
      const userMessage = this.extractUserMessage(requestContext);
      if (!userMessage) {
        throw new Error('No user message found in request');
      }

      console.log(`💬 User message: "${userMessage}"`);

      // 调用 A2UIAgent 生成界面
      const result = await this.a2uiAgent.processMessage(userMessage);

      if (result.a2ui) {
        // 成功生成 A2UI - 需要创建 Task 并添加 artifact
        const artifactId = uuidv4();
        const taskId = requestContext.taskId;
        const agentMessageId = uuidv4();
        
        console.log(`📦 Creating task with ID: ${taskId}`);
        console.log(`📋 A2UI components count: ${result.a2ui.components?.length || 0}`);
        
        // 重要：SDK 的 firstResult 逻辑会在遇到 message 事件时直接返回 message
        // 而不是返回 task。所以我们需要：
        // 1. 先发布 task 事件
        // 2. 然后发布 artifact-update 事件（不发布 message 事件！）
        // 3. task.history 在 task 事件中包含 agent 的回复
        
        // 1. 发布 Task 事件（包含 agent 消息在 history 中）
        eventBus.publish({
          kind: 'task',
          id: taskId,
          contextId: requestContext.contextId,
          status: { kind: 'in_progress' },
          artifacts: [],
          history: [{
            kind: 'message',
            messageId: agentMessageId,
            role: 'agent',
            parts: [{
              kind: 'text',
              text: result.text
            }],
            contextId: requestContext.contextId
          }]
        });
        
        console.log('✅ Task event published with history');

        // 2. 发布 Artifact 更新事件（会被添加到 task.artifacts）
        const artifact = {
          artifactId,
          name: 'a2ui-component.json',
          parts: [{
            kind: 'data',
            contentType: 'application/json',
            data: JSON.stringify({
              message: result.text,
              a2ui: result.a2ui,
              timestamp: result.timestamp
            })
          }]
        };
        
        console.log('📦 Publishing artifact:', artifactId);
        
        eventBus.publish({
          kind: 'artifact-update',
          taskId: taskId,
          contextId: requestContext.contextId,
          artifact
        });
      } else {
        // 纯文本响应（无界面）
        eventBus.publish({
          kind: 'message',
          messageId: uuidv4(),
          role: 'agent',
          parts: [{
            kind: 'text',
            text: result.text
          }],
          contextId: requestContext.contextId
        });
      }

      // 标记完成（SDK 要求）
      eventBus.finished();
      console.log('✅ A2A request completed successfully');

    } catch (error) {
      console.error('❌ A2A execution error:', error);
      
      // 发送错误消息
      eventBus.publish({
        kind: 'message',
        messageId: uuidv4(),
        role: 'agent',
        parts: [{
          kind: 'text',
          text: `抱歉，处理请求时出错：${error.message}`
        }],
        contextId: requestContext.contextId
      });
      
      // 标记失败（SDK 要求）
      eventBus.failed(error);
    }
  }

  /**
   * 取消任务（SDK 要求实现）
   * @param {string} taskId - 任务 ID
   * @param {import('@a2a-js/sdk/server').ExecutionEventBus} _eventBus - 事件总线（未使用）
   */
  async cancelTask(taskId, _eventBus) {
    console.log(`⏹️ Task cancellation requested: ${taskId}`);
    // A2UIAgent 是即时响应的，不支持长时间任务取消
    // 如果需要，可以在这里添加取消逻辑
  }

  /**
   * 从请求上下文中提取用户消息文本
   * @private
   */
  extractUserMessage(requestContext) {
    // SDK 格式：requestContext.userMessage 包含最新的用户消息
    if (requestContext.userMessage && requestContext.userMessage.parts) {
      const textParts = requestContext.userMessage.parts
        .filter(part => part.kind === 'text')
        .map(part => part.text);
      return textParts.join(' ');
    }

    // 兼容旧格式：从 messages 数组提取
    const messages = requestContext.messages || [];
    const lastMessage = messages[messages.length - 1];
    
    if (!lastMessage || !lastMessage.parts) {
      return null;
    }

    const textParts = lastMessage.parts
      .filter(part => part.kind === 'text')
      .map(part => part.text);

    return textParts.join(' ');
  }
}
