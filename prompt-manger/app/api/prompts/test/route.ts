import { NextRequest, NextResponse } from 'next/server';

interface TestRequest {
  model: string;
  modelVersion: string;
  apiKey: string;
  prompt: string;
  input: string;
  baseUrl?: string; // 用于 Ollama 和其他自定义端点
}

interface TestResponse {
  success: boolean;
  output: string;
  model: string;
  modelVersion: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

// 通义千问 API 调用
async function callQwen(apiKey: string, modelVersion: string, prompt: string, input: string) {
  const url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelVersion,
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: input,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Qwen API Error: ${error}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices?.[0]?.message?.content || '无响应',
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      totalTokens: data.usage.total_tokens || 0,
    } : undefined,
  };
}

// 腾讯混元 API 调用
// 使用内部简化 API 端点（仅需单个 Key）
async function callHunyuan(apiKey: string, modelVersion: string, prompt: string, input: string) {
  const url = 'http://hunyuanapi.woa.com/openapi/v1/chat/completions';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelVersion,
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: input,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hunyuan API Error: ${error}`);
  }

  const data = await response.json();
  
  // 检查响应错误
  if (data.error) {
    throw new Error(`Hunyuan API Error: ${data.error.message || JSON.stringify(data.error)}`);
  }
  
  return {
    content: data.choices?.[0]?.message?.content || '无响应',
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      totalTokens: data.usage.total_tokens || 0,
    } : undefined,
  };
}

// DeepSeek API 调用
async function callDeepSeek(apiKey: string, modelVersion: string, prompt: string, input: string) {
  const url = 'https://api.deepseek.com/v1/chat/completions';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelVersion,
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: input,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API Error: ${error}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices?.[0]?.message?.content || '无响应',
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      totalTokens: data.usage.total_tokens || 0,
    } : undefined,
  };
}

// Ollama API 调用（本地部署）
async function callOllama(baseUrl: string, modelVersion: string, prompt: string, input: string) {
  // 移除末尾的斜杠
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const url = `${cleanBaseUrl}/api/generate`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelVersion,
      prompt: `${prompt}\n\n${input}`,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API Error: ${response.status} ${error}`);
  }

  const data = await response.json();
  
  return {
    content: data.response || '无响应',
    usage: data.prompt_eval_count !== undefined && data.eval_count !== undefined ? {
      promptTokens: data.prompt_eval_count || 0,
      completionTokens: data.eval_count || 0,
      totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
    } : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: TestRequest = await request.json();
    const { model, modelVersion, apiKey, prompt, input, baseUrl } = body;

    // 验证必填字段
    if (!model || !modelVersion || !prompt || !input) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // Ollama 不需要 API Key，其他模型需要
    if (model !== 'ollama' && !apiKey) {
      return NextResponse.json(
        { error: 'API Key 是必填项' },
        { status: 400 }
      );
    }

    // Ollama 需要 baseUrl
    if (model === 'ollama' && !baseUrl) {
      return NextResponse.json(
        { error: 'Ollama 需要配置 Base URL' },
        { status: 400 }
      );
    }

    let result: { content: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } };

    // 根据模型类型调用对应的 API
    switch (model) {
      case 'qwen':
        result = await callQwen(apiKey, modelVersion, prompt, input);
        break;
      case 'hunyuan':
        result = await callHunyuan(apiKey, modelVersion, prompt, input);
        break;
      case 'deepseek':
        result = await callDeepSeek(apiKey, modelVersion, prompt, input);
        break;
      case 'ollama':
        result = await callOllama(baseUrl!, modelVersion, prompt, input);
        break;
      default:
        return NextResponse.json(
          { error: '不支持的模型类型' },
          { status: 400 }
        );
    }

    const response: TestResponse = {
      success: true,
      output: result.content,
      model,
      modelVersion,
      usage: result.usage,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Test API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '测试失败' },
      { status: 500 }
    );
  }
}
