import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

/**
 * 执行可视化构建的工作流
 * @param {Array} nodes - React Flow 节点数组
 * @param {Array} edges - React Flow 边数组
 * @param {Object} config - 全局配置
 * @param {Function} onLog - 日志回调
 * @param {Function} onNodeStatusChange - 节点状态变化回调
 */
export async function executeWorkflow(nodes, edges, config, onLog, onNodeStatusChange) {
  // 1. 验证工作流
  const validation = validateWorkflow(nodes, edges);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  onLog({ type: 'info', message: '🚀 开始执行工作流...' });

  // 2. 构建执行图
  const graph = buildExecutionGraph(nodes, edges);
  
  // 3. 找到起始节点
  const startNode = nodes.find(n => n.data.agentType === 'start');
  if (!startNode) {
    throw new Error('未找到起始节点');
  }

  // 4. 初始化状态
  let state = {
    topic: '请输入研究主题', // 可以从 UI 输入
    content: '',
    iteration: 0,
    maxIterations: config.maxIterations,
    history: [],
  };

  // 5. 执行工作流
  const result = await executeNode(
    startNode.id,
    state,
    graph,
    nodes,
    config,
    onLog,
    onNodeStatusChange
  );

  onLog({ type: 'success', message: '✅ 工作流执行完成！' });
  
  return result;
}

/**
 * 验证工作流的有效性
 */
function validateWorkflow(nodes, edges) {
  // 检查是否有节点
  if (nodes.length === 0) {
    return { valid: false, error: '工作流至少需要一个节点' };
  }

  // 检查是否有起始节点
  const startNodes = nodes.filter(n => n.data.agentType === 'start');
  if (startNodes.length === 0) {
    return { valid: false, error: '工作流必须有一个起始节点' };
  }
  if (startNodes.length > 1) {
    return { valid: false, error: '工作流只能有一个起始节点' };
  }

  // 检查是否有结束节点
  const endNodes = nodes.filter(n => n.data.agentType === 'end');
  if (endNodes.length === 0) {
    return { valid: false, error: '工作流必须有一个结束节点' };
  }

  // 检查节点是否都有连接
  const nodeIds = new Set(nodes.map(n => n.id));
  const connectedNodes = new Set();
  edges.forEach(edge => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  const isolatedNodes = nodes.filter(n => 
    !connectedNodes.has(n.id) && 
    n.data.agentType !== 'end'
  );

  if (isolatedNodes.length > 0) {
    return { 
      valid: false, 
      error: `节点 "${isolatedNodes[0].data.label}" 未连接到工作流` 
    };
  }

  return { valid: true };
}

/**
 * 构建执行图（邻接表）
 */
function buildExecutionGraph(nodes, edges) {
  const graph = {};
  
  nodes.forEach(node => {
    graph[node.id] = {
      node,
      next: [],
    };
  });

  edges.forEach(edge => {
    if (graph[edge.source]) {
      graph[edge.source].next.push(edge.target);
    }
  });

  return graph;
}

/**
 * 递归执行节点
 */
async function executeNode(
  nodeId,
  state,
  graph,
  nodes,
  config,
  onLog,
  onNodeStatusChange
) {
  const graphNode = graph[nodeId];
  if (!graphNode) {
    throw new Error(`节点 ${nodeId} 不存在`);
  }

  const node = graphNode.node;
  const { agentType, label } = node.data;

  // 更新节点状态为运行中
  onNodeStatusChange(nodeId, 'running');
  onLog({ 
    type: 'info', 
    message: `📍 执行节点: ${label} (${agentType})` 
  });

  try {
    // 根据节点类型执行不同逻辑
    let newState = { ...state };

    if (agentType === 'start') {
      // 起始节点，直接传递状态
      newState.history.push({
        node: label,
        type: 'start',
        timestamp: new Date().toISOString(),
      });
    } else if (agentType === 'end') {
      // 结束节点
      newState.history.push({
        node: label,
        type: 'end',
        timestamp: new Date().toISOString(),
      });
      onNodeStatusChange(nodeId, 'completed');
      return newState;
    } else {
      // Agent 节点，调用 LLM
      const result = await executeAgent(node, state, config, onLog);
      newState.content = result;
      newState.iteration += 1;
      newState.history.push({
        node: label,
        type: agentType,
        content: result,
        timestamp: new Date().toISOString(),
      });
    }

    // 更新节点状态为完成
    onNodeStatusChange(nodeId, 'completed');

    // 执行下一个节点
    if (graphNode.next.length === 0) {
      // 没有下一个节点，可能是悬空的
      onLog({ type: 'info', message: `⚠️  节点 ${label} 后没有连接` });
      return newState;
    }

    // 如果有多个下一个节点，执行第一个（后续可以支持条件分支）
    const nextNodeId = graphNode.next[0];
    return await executeNode(nextNodeId, newState, graph, nodes, config, onLog, onNodeStatusChange);

  } catch (error) {
    onNodeStatusChange(nodeId, 'error');
    onLog({ 
      type: 'error', 
      message: `❌ 节点 ${label} 执行失败: ${error.message}` 
    });
    throw error;
  }
}

/**
 * 执行 Agent 节点（调用 LLM）
 */
async function executeAgent(node, state, config, onLog) {
  const { label, config: nodeConfig } = node.data;
  const { systemPrompt, temperature } = nodeConfig || {};

  if (!systemPrompt) {
    throw new Error(`Agent ${label} 未配置系统提示词`);
  }

  onLog({ 
    type: 'info', 
    message: `🤖 ${label} 正在思考...` 
  });

  // 初始化模型
  const model = new ChatOpenAI({
    modelName: config.modelName || 'hunyuan-lite',
    temperature: temperature || 0.7,
    openAIApiKey: config.apiKey || 'dummy-key',
    configuration: {
      baseURL: config.baseURL || 'http://hunyuanapi.woa.com/openapi/v1',
    },
    modelKwargs: {
      presence_penalty: undefined,
      frequency_penalty: undefined,
    },
  });

  // 构建消息
  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(buildUserMessage(state)),
  ];

  // 调用模型
  const response = await model.invoke(messages);
  const result = response.content;

  onLog({ 
    type: 'success', 
    message: `✅ ${label} 完成响应` 
  });

  return result;
}

/**
 * 构建用户消息
 */
function buildUserMessage(state) {
  if (state.content) {
    return `当前内容：\n${state.content}\n\n请根据你的角色处理这个内容。`;
  } else {
    return `请研究主题: ${state.topic}`;
  }
}
