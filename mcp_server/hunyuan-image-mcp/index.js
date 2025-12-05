#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { HunyuanImageService } from './service.js';

dotenv.config();

const API_KEY = process.env.HUNYUAN_API_KEY;
const BASE_URL = process.env.HUNYUAN_BASE_URL || 'http://hunyuanapi.woa.com/openapi/v1';
const IMAGE_MODEL = process.env.HUNYUAN_IMAGE_MODEL || 'hunyuan-image';

if (!API_KEY) {
  console.error('错误: 请在 .env 文件中配置 HUNYUAN_API_KEY');
  process.exit(1);
}

class HunyuanImageMCPServer {
  constructor() {
    this.server = new Server(
      { name: 'hunyuan-image-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.imageService = new HunyuanImageService(API_KEY, BASE_URL, IMAGE_MODEL);
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    this._setupHandlers();
  }

  _setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [{
        name: 'generate_image',
        description: '使用混元 API 根据文本描述生成图片',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: '图片描述文本（必填）',
            },
            negative_prompt: {
              type: 'string',
              description: '负面提示词（可选）',
            },
            width: {
              type: 'number',
              description: '图片宽度，默认 1024',
              default: 1024,
            },
            height: {
              type: 'number',
              description: '图片高度，默认 1024',
              default: 1024,
            },
            steps: {
              type: 'number',
              description: '推理步数，默认 20',
              default: 20,
            },
            guidance_scale: {
              type: 'number',
              description: 'CFG 引导系数，默认 7.5',
              default: 7.5,
            },
            seed: {
              type: 'number',
              description: '随机种子（可选）',
            },
            style: {
              type: 'string',
              description: '图片风格（可选）',
            },
          },
          required: ['prompt'],
        },
      }],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        if (request.params.name === 'generate_image') {
          return await this._handleGenerateImage(request.params.arguments);
        }
        throw new Error(`未知的工具: ${request.params.name}`);
      } catch (error) {
        return {
          content: [{ type: 'text', text: `错误: ${error.message}` }],
          isError: true,
        };
      }
    });
  }

  async _handleGenerateImage(args) {
    const { prompt, negative_prompt, width = 1024, height = 1024, steps = 20, guidance_scale = 7.5, seed, style } = args;

    if (!prompt?.trim()) {
      throw new Error('prompt 参数不能为空');
    }

    console.error(`[生成图片] ${prompt}`);

    const result = await this.imageService.generateImage({
      prompt: prompt.trim(),
      negative_prompt,
      width,
      height,
      steps,
      guidance_scale,
      seed,
      style,
    });

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Hunyuan Image MCP Server 已启动');
  }
}

const server = new HunyuanImageMCPServer();
server.start().catch((error) => {
  console.error('服务器启动失败:', error);
  process.exit(1);
});
