import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { ResearchReviewWorkflow } from '../workflow.js';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

/**
 * 健康检查接口
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

/**
 * 获取配置信息
 */
app.get('/api/config', (req, res) => {
  res.json({
    baseURL: process.env.HUNYUAN_BASE_URL || 'http://hunyuanapi.woa.com/openapi/v1',
    modelName: process.env.HUNYUAN_MODEL || 'hunyuan-lite',
    maxIterations: parseInt(process.env.MAX_ITERATIONS) || 3,
    hasApiKey: !!process.env.HUNYUAN_API_KEY,
  });
});

/**
 * 执行预定义的研究-评审工作流
 */
app.post('/api/workflow/execute', async (req, res) => {
  try {
    const { topic, maxIterations } = req.body;

    if (!topic) {
      return res.status(400).json({ error: '缺少 topic 参数' });
    }

    const config = {
      apiKey: process.env.HUNYUAN_API_KEY,
      baseURL: process.env.HUNYUAN_BASE_URL || 'http://hunyuanapi.woa.com/openapi/v1',
      modelName: process.env.HUNYUAN_MODEL || 'hunyuan-lite',
      maxIterations: maxIterations || parseInt(process.env.MAX_ITERATIONS) || 3,
    };

    const workflow = new ResearchReviewWorkflow(config);
    const result = await workflow.execute(topic);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('工作流执行错误:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 执行自定义可视化工作流
 */
app.post('/api/workflow/visual-execute', async (req, res) => {
  try {
    const { nodes, edges, input, config } = req.body;

    if (!nodes || !edges) {
      return res.status(400).json({ error: '缺少 nodes 或 edges 参数' });
    }

    // 验证工作流
    const validation = validateWorkflow(nodes, edges);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // 获取 API 配置
    const apiConfig = {
      apiKey: process.env.HUNYUAN_API_KEY,
      baseURL: process.env.HUNYUAN_BASE_URL || 'http://hunyuanapi.woa.com/openapi/v1',
      modelName: config?.modelName || process.env.HUNYUAN_MODEL || 'hunyuan-lite',
      maxIterations: config?.maxIterations || parseInt(process.env.MAX_ITERATIONS) || 3,
    };

    // 执行工作流
    const logs = [];
    const result = await executeVisualWorkflow(
      nodes, 
      edges, 
      input || '请研究人工智能的发展历程',
      apiConfig,
      (log) => logs.push(log)
    );

    res.json({
      success: true,
      data: result,
      logs: logs,
    });
  } catch (error) {
    console.error('可视化工作流执行错误:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 执行单个 Agent 节点
 */
app.post('/api/agent/execute', async (req, res) => {
  try {
    const { systemPrompt, userMessage, temperature, modelName } = req.body;

    if (!systemPrompt || !userMessage) {
      return res.status(400).json({ error: '缺少 systemPrompt 或 userMessage 参数' });
    }

    const config = {
      apiKey: process.env.HUNYUAN_API_KEY,
      baseURL: process.env.HUNYUAN_BASE_URL || 'http://hunyuanapi.woa.com/openapi/v1',
      modelName: modelName || process.env.HUNYUAN_MODEL || 'hunyuan-lite',
    };

    const result = await executeAgent(
      systemPrompt,
      userMessage,
      temperature || 0.7,
      config
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Agent 执行错误:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 验证工作流
 */
function validateWorkflow(nodes, edges) {
  if (nodes.length === 0) {
    return { valid: false, error: '工作流至少需要一个节点' };
  }

  const startNodes = nodes.filter(n => n.data.agentType === 'start');
  if (startNodes.length === 0) {
    return { valid: false, error: '工作流必须有一个起始节点' };
  }
  if (startNodes.length > 1) {
    return { valid: false, error: '工作流只能有一个起始节点' };
  }

  const endNodes = nodes.filter(n => n.data.agentType === 'end');
  if (endNodes.length === 0) {
    return { valid: false, error: '工作流必须有一个结束节点' };
  }

  return { valid: true };
}

/**
 * 执行可视化工作流
 */
async function executeVisualWorkflow(nodes, edges, input, config, onLog) {
  onLog({ type: 'info', message: '🚀 开始执行工作流...', timestamp: new Date().toISOString() });

  // 构建执行图
  const graph = buildExecutionGraph(nodes, edges);
  
  // 找到起始节点
  const startNode = nodes.find(n => n.data.agentType === 'start');
  
  // 初始化状态
  let state = {
    input: input,
    content: '',
    iteration: 0,
    maxIterations: config.maxIterations,
    history: [],
  };

  // 执行工作流
  const result = await executeNode(
    startNode.id,
    state,
    graph,
    config,
    onLog
  );

  onLog({ type: 'success', message: '✅ 工作流执行完成！', timestamp: new Date().toISOString() });
  
  return result;
}

/**
 * 构建执行图
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
async function executeNode(nodeId, state, graph, config, onLog) {
  const graphNode = graph[nodeId];
  if (!graphNode) {
    throw new Error(`节点 ${nodeId} 不存在`);
  }

  const node = graphNode.node;
  const { agentType, label } = node.data;

  onLog({ 
    type: 'info', 
    message: `📍 执行节点: ${label} (${agentType})`,
    timestamp: new Date().toISOString(),
  });

  let newState = { ...state };

  if (agentType === 'start') {
    newState.history.push({
      node: label,
      type: 'start',
      timestamp: new Date().toISOString(),
    });
  } else if (agentType === 'end') {
    newState.history.push({
      node: label,
      type: 'end',
      timestamp: new Date().toISOString(),
    });
    return newState;
  } else {
    // Agent 节点
    const result = await executeAgentNode(node, state, config, onLog);
    newState.content = result;
    newState.iteration += 1;
    newState.history.push({
      node: label,
      type: agentType,
      content: result,
      timestamp: new Date().toISOString(),
    });
  }

  // 执行下一个节点
  if (graphNode.next.length === 0) {
    return newState;
  }

  const nextNodeId = graphNode.next[0];
  return await executeNode(nextNodeId, newState, graph, config, onLog);
}

/**
 * 执行 Agent 节点
 */
async function executeAgentNode(node, state, config, onLog) {
  const { label, config: nodeConfig } = node.data;
  const { systemPrompt, temperature } = nodeConfig || {};

  if (!systemPrompt) {
    throw new Error(`Agent ${label} 未配置系统提示词`);
  }

  onLog({ 
    type: 'info', 
    message: `🤖 ${label} 正在思考...`,
    timestamp: new Date().toISOString(),
  });

  const userMessage = state.content 
    ? `当前内容：\n${state.content}\n\n请根据你的角色处理这个内容。`
    : `请研究主题: ${state.input}`;

  const result = await executeAgent(
    systemPrompt,
    userMessage,
    temperature || 0.7,
    config
  );

  onLog({ 
    type: 'success', 
    message: `✅ ${label} 完成响应`,
    timestamp: new Date().toISOString(),
  });

  return result;
}

/**
 * 执行 Agent（调用 LLM）
 */
async function executeAgent(systemPrompt, userMessage, temperature, config) {
  const model = new ChatOpenAI({
    modelName: config.modelName,
    temperature: temperature,
    openAIApiKey: config.apiKey || 'dummy-key',
    configuration: {
      baseURL: config.baseURL,
    },
    modelKwargs: {
      presence_penalty: undefined,
      frequency_penalty: undefined,
    },
  });

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userMessage),
  ];

  const response = await model.invoke(messages);
  return response.content;
}

// 启动服务器
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('🚀 LangGraph Agent API 服务已启动');
  console.log('═══════════════════════════════════════');
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🧠 模型: ${process.env.HUNYUAN_MODEL || 'hunyuan-lite'}`);
  console.log('');
  console.log('📚 API 端点:');
  console.log(`   GET  /api/health              - 健康检查`);
  console.log(`   GET  /api/config              - 获取配置`);
  console.log(`   POST /api/workflow/execute    - 执行预定义工作流`);
  console.log(`   POST /api/workflow/visual-execute - 执行可视化工作流`);
  console.log(`   POST /api/agent/execute       - 执行单个 Agent`);
  console.log('═══════════════════════════════════════');
  console.log('');
});

export default app;
