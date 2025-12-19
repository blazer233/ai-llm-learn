import { v4 as uuidv4 } from 'uuid';

/**
 * A2A 客户端封装（使用官方 SDK）
 * 
 * 注意：由于 @a2a-js/sdk/client 主要为 Node.js 环境设计，
 * 在浏览器环境中我们保持轻量级的手动实现
 */

export class A2AClient {
  constructor(baseUrl = '/api/a2a') {
    this.baseUrl = baseUrl;
    this.jsonRpcUrl = `${baseUrl}/jsonrpc`;
  }

  /**
   * 发送消息到 A2UI Agent
   * @param {string} text - 用户消息文本
   * @param {object} options - 可选配置
   * @returns {Promise<object>} - { message, a2ui, artifacts }
   */
  async sendMessage(text, options = {}) {
    const messageId = uuidv4();
    const contextId = options.contextId || uuidv4();
    const taskId = options.taskId || uuidv4();

    // 构建符合 SDK 规范的 JSON-RPC 请求
    const rpcRequest = {
      jsonrpc: '2.0',
      method: 'agent.sendMessage',
      params: {
        message: {
          messageId,
          kind: 'message',
          role: 'user',
          parts: [{ kind: 'text', text }],
          contextId
        },
        contextId,
        taskId,
        user: options.user || { id: 'anonymous' },
        configuration: options.configuration || {
          blocking: true,
          acceptedOutputModes: ['text/plain', 'application/json']
        }
      },
      id: uuidv4()
    };

    try {
      const response = await fetch(this.jsonRpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rpcRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rpcResponse = await response.json();

      if (rpcResponse.error) {
        // 直接抛出服务端返回的错误信息
        throw new Error(rpcResponse.error.message);
      }

      // 解析响应（SDK 格式）
      return this.parseResponse(rpcResponse.result);

    } catch (error) {
      console.error('❌ A2A Client error:', error);
      throw error;
    }
  }

  /**
   * 解析 SDK 格式的响应
   * @private
   */
  parseResponse(result) {
    console.log('🔍 Starting parseResponse with result:', JSON.stringify(result, null, 2));
    
    // SDK 可能返回 Message 或 Task
    const isTask = result.kind === 'task';
    const isMessage = result.kind === 'message';
    
    console.log(`📋 Result type: ${result.kind || 'unknown'}`);
    console.log(`📊 Result keys: ${Object.keys(result).join(', ')}`);
    
    let responseText = '';
    let a2ui = null;
    let artifacts = [];
    
    if (isTask) {
      // Task 对象：{ kind: 'task', id, contextId, status, artifacts, history }
      console.log('✅ Processing Task response');
      artifacts = result.artifacts || [];
      
      // 从 history 中提取最后一条 agent 消息作为文本
      if (result.history && result.history.length > 0) {
        const lastMessage = result.history[result.history.length - 1];
        if (lastMessage.role === 'agent' && lastMessage.parts) {
          const textParts = lastMessage.parts
            .filter(p => p.kind === 'text')
            .map(p => p.text);
          responseText = textParts.join(' ');
          console.log('📝 Extracted text from history:', responseText);
        }
      }
    } else if (isMessage) {
      // Message 对象：{ kind: 'message', role, parts, contextId }
      console.log('✅ Processing Message response');
      artifacts = result.artifacts || [];
      
      if (result.parts) {
        const textParts = result.parts
          .filter(p => p.kind === 'text')
          .map(p => p.text);
        responseText = textParts.join(' ');
        console.log('📝 Extracted text from parts:', responseText);
      }
    } else {
      // 兼容旧格式
      console.warn('⚠️ Unknown result format, attempting legacy parsing');
      const message = result.message || result;
      artifacts = result.artifacts || [];
      
      if (message.parts) {
        const textParts = message.parts
          .filter(p => p.kind === 'text')
          .map(p => p.text);
        responseText = textParts.join(' ');
      }
    }

    // 提取 A2UI（从 artifacts）
    console.log('🔍 Parsing artifacts, count:', artifacts.length);
    
    if (artifacts.length > 0) {
      console.log('📦 Full artifacts structure:', JSON.stringify(artifacts, null, 2));
      
      // Task 的 artifacts 数组直接包含 Artifact 对象
      // Artifact 对象结构：{ artifactId, name, parts: [{kind, contentType, data}] }
      const a2uiArtifact = artifacts.find(artifact => {
        // 直接检查 artifact 的 parts（不是 artifact.artifact）
        const hasJsonPart = artifact.parts?.some(p => p.contentType === 'application/json');
        console.log(`🔍 Checking artifact ${artifact.artifactId}:`, {
          name: artifact.name,
          hasParts: !!artifact.parts,
          partsCount: artifact.parts?.length,
          hasJsonPart
        });
        return hasJsonPart;
      });
      
      console.log('🎯 Found A2UI artifact:', !!a2uiArtifact);
      
      if (a2uiArtifact) {
        try {
          // Artifact.parts[0].data 包含 JSON 字符串
          const jsonPart = a2uiArtifact.parts.find(p => p.contentType === 'application/json');
          
          if (jsonPart && jsonPart.data) {
            const rawData = jsonPart.data;
            console.log('📄 Raw artifact data (first 200 chars):', rawData.substring(0, 200));
            const artifactData = JSON.parse(rawData);
            console.log('✅ Parsed artifact data keys:', Object.keys(artifactData));
            
            if (artifactData.a2ui) {
              a2ui = artifactData.a2ui;
              console.log('🎨 Extracted A2UI with', a2ui.components?.length, 'components');
              // 如果 artifact 中有更好的消息，使用它
              if (artifactData.message) {
                responseText = artifactData.message;
              }
            } else {
              console.warn('⚠️ No a2ui field in artifact data');
            }
          } else {
            console.error('❌ No JSON part found in artifact');
          }
        } catch (e) {
          console.error('❌ Failed to parse artifact data:', e);
          console.error('Stack:', e.stack);
        }
      } else {
        console.warn('⚠️ No artifact with JSON contentType found');
      }
    }

    return {
      text: responseText,
      a2ui,
      artifacts,
      contextId: result.contextId,
      timestamp: Date.now()
    };
  }

  /**
   * 流式发送消息（使用 SSE）
   * @param {string} _text - 用户消息文本
   * @param {function} _onEvent - 事件回调
   * @param {object} _options - 可选配置
   */
  async sendMessageStream(_text, _onEvent, _options = {}) {
    // TODO: 实现 SSE 流式响应
    throw new Error('Streaming not yet implemented');
  }

  /**
   * 获取 Agent Card
   */
  async getAgentCard() {
    const response = await fetch(`${this.baseUrl}/agent-card`);
    if (!response.ok) {
      throw new Error(`Failed to get agent card: ${response.statusText}`);
    }
    return response.json();
  }
}

// 默认客户端实例
export const a2aClient = new A2AClient();
