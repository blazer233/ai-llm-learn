import { NextRequest, NextResponse } from 'next/server';

interface TestRequest {
  model: string;
  modelVersion: string;
  apiKey: string;
  prompt: string;
  input: string;
}

// 通义千问 API 调用
async function callQwen(apiKey: string, modelVersion: string, prompt: string, input: string) {
  const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-DashScope-SSE': 'disable',
    },
    body: JSON.stringify({
      model: modelVersion,
      input: {
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
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Qwen API Error: ${error}`);
  }

  const data = await response.json();
  return data.output?.text || data.output?.choices?.[0]?.message?.content || '无响应';
}

// 腾讯混元 API 调用
async function callHunyuan(apiKey: string, modelVersion: string, prompt: string, input: string) {
  // 腾讯混元需要使用腾讯云 SDK，这里提供一个简化的示例
  // 实际使用时需要安装 tencentcloud-sdk-nodejs 并配置 SecretId 和 SecretKey
  throw new Error('腾讯混元需要使用腾讯云 SDK，请参考文档配置：https://cloud.tencent.com/document/product/1729');
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
  return data.choices?.[0]?.message?.content || '无响应';
}

// Google Gemini API 调用
async function callGemini(apiKey: string, modelVersion: string, prompt: string, input: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${prompt}\n\n${input}`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API Error: ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '无响应';
}

export async function POST(request: NextRequest) {
  try {
    const body: TestRequest = await request.json();
    const { model, modelVersion, apiKey, prompt, input } = body;

    // 验证必填字段
    if (!model || !modelVersion || !apiKey || !prompt || !input) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    let output = '';

    // 根据模型类型调用对应的 API
    switch (model) {
      case 'qwen':
        output = await callQwen(apiKey, modelVersion, prompt, input);
        break;
      case 'hunyuan':
        output = await callHunyuan(apiKey, modelVersion, prompt, input);
        break;
      case 'deepseek':
        output = await callDeepSeek(apiKey, modelVersion, prompt, input);
        break;
      case 'gemini':
        output = await callGemini(apiKey, modelVersion, prompt, input);
        break;
      default:
        return NextResponse.json(
          { error: '不支持的模型类型' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      output,
      model,
      modelVersion,
    });
  } catch (error) {
    console.error('Test API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '测试失败' },
      { status: 500 }
    );
  }
}
