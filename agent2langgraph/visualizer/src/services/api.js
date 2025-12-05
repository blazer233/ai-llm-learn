/**
 * API 服务模块
 * 与后端 API 通信的接口封装
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * 通用请求函数
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `请求失败: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API 请求错误:', error);
    throw error;
  }
}

/**
 * 健康检查
 */
export async function checkHealth() {
  return request('/api/health');
}

/**
 * 获取服务器配置
 */
export async function getConfig() {
  return request('/api/config');
}

/**
 * 执行预定义的研究-评审工作流
 */
export async function executeWorkflow(topic, maxIterations) {
  return request('/api/workflow/execute', {
    method: 'POST',
    body: JSON.stringify({ topic, maxIterations }),
  });
}

/**
 * 执行可视化工作流
 */
export async function executeVisualWorkflow(nodes, edges, input, config) {
  return request('/api/workflow/visual-execute', {
    method: 'POST',
    body: JSON.stringify({ nodes, edges, input, config }),
  });
}

/**
 * 执行单个 Agent
 */
export async function executeAgent(systemPrompt, userMessage, temperature, modelName) {
  return request('/api/agent/execute', {
    method: 'POST',
    body: JSON.stringify({ systemPrompt, userMessage, temperature, modelName }),
  });
}

/**
 * WebSocket 连接（用于流式输出，可选）
 */
export function createWorkflowStream(nodes, edges, input, config, onMessage, onError, onComplete) {
  // 如果后续需要支持流式输出，可以使用 WebSocket
  // 目前先使用 HTTP 轮询
  console.log('流式输出功能待实现');
}
