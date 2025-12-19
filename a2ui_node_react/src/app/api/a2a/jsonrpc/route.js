import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { A2UIExecutor } from '@/lib/a2a-executor';
import { DefaultRequestHandler, InMemoryTaskStore, RequestContext } from '@a2a-js/sdk/server';
import { getAgentCard } from '@/lib/a2a-agent-card';

/**
 * A2A JSON-RPC Endpoint (使用官方 SDK)
 * POST /api/a2a/jsonrpc
 * 
 * 使用 @a2a-js/sdk 的 DefaultRequestHandler 和标准接口
 */

const agentExecutor = new A2UIExecutor();
const taskStore = new InMemoryTaskStore();
const agentCard = getAgentCard();

// 使用 SDK 的 DefaultRequestHandler
const requestHandler = new DefaultRequestHandler(
  agentCard,
  taskStore,
  agentExecutor
);

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('📨 A2A JSON-RPC request:', body);

    // 验证 JSON-RPC 格式
    if (!body.jsonrpc || body.jsonrpc !== '2.0') {
      return createErrorResponse(-32600, 'Invalid Request: jsonrpc version must be 2.0', body.id);
    }

    if (!body.method) {
      return createErrorResponse(-32600, 'Invalid Request: method is required', body.id);
    }

    // 路由到对应的方法处理器（使用 SDK）
    switch (body.method) {
      case 'agent.sendMessage':
        return await handleSendMessageWithSDK(body);
      
      case 'agent.getTask':
        return await handleGetTask(body);
      
      case 'agent.cancelTask':
        return await handleCancelTask(body);
      
      default:
        return createErrorResponse(-32601, `Method not found: ${body.method}`, body.id);
    }

  } catch (error) {
    console.error('❌ A2A JSON-RPC error:', error);
    return createErrorResponse(-32603, error.message || 'Internal error', null);
  }
}

/**
 * 处理 agent.sendMessage 方法（使用 SDK）
 */
async function handleSendMessageWithSDK(rpcRequest) {
  const { params, id } = rpcRequest;

  if (!params || !params.message) {
    return createErrorResponse(-32602, 'Invalid params: message is required', id);
  }

  try {
    const message = params.message;
    const contextId = params.contextId || message.contextId || uuidv4();
    const taskId = params.taskId || uuidv4();

    // 调用 requestHandler 的 sendMessage 方法
    const result = await requestHandler.sendMessage({
      message,
      contextId,
      taskId,
      user: params.user,
      configuration: params.configuration
    });

    console.log('✅ SDK sendMessage result type:', result.kind || (result.taskId ? 'Task' : 'Message'));
    console.log('📊 Result keys:', Object.keys(result));
    if (result.artifacts) {
      console.log('📦 Artifacts in result:', result.artifacts.length);
    }

    // 返回标准 JSON-RPC 响应
    return NextResponse.json({
      jsonrpc: '2.0',
      result,
      id
    });

  } catch (error) {
    console.error('❌ SendMessage error:', error);
    return createErrorResponse(-32000, error.message, id);
  }
}

/**
 * 处理 agent.getTask 方法
 */
async function handleGetTask(rpcRequest) {
  const { params, id } = rpcRequest;

  if (!params || !params.taskId) {
    return createErrorResponse(-32602, 'Invalid params: taskId is required', id);
  }

  try {
    const task = await requestHandler.getTask({
      taskId: params.taskId,
      contextId: params.contextId
    });

    return NextResponse.json({
      jsonrpc: '2.0',
      result: task,
      id
    });
  } catch (error) {
    return createErrorResponse(-32000, error.message, id);
  }
}

/**
 * 处理 agent.cancelTask 方法
 */
async function handleCancelTask(rpcRequest) {
  const { params, id } = rpcRequest;

  if (!params || !params.taskId) {
    return createErrorResponse(-32602, 'Invalid params: taskId is required', id);
  }

  try {
    await requestHandler.cancelTask({
      taskId: params.taskId,
      contextId: params.contextId
    });
    
    return NextResponse.json({
      jsonrpc: '2.0',
      result: { success: true },
      id
    });
  } catch (error) {
    return createErrorResponse(-32000, error.message, id);
  }
}

/**
 * 创建 JSON-RPC 错误响应
 */
function createErrorResponse(code, message, id) {
  return NextResponse.json({
    jsonrpc: '2.0',
    error: {
      code,
      message
    },
    id
  }, {
    status: code === -32600 || code === -32601 ? 400 : 500
  });
}
