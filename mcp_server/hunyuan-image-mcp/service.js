import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class HunyuanImageService {
  constructor(apiKey, baseURL, model = 'hunyuan-image') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.model = model;
    this.outputDir = path.join(__dirname, 'generated_images');
    this._ensureOutputDir();
  }

  async _ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('创建输出目录失败:', error);
    }
  }

  async generateImage(params) {
    const { prompt, negative_prompt, width = 1024, height = 1024, steps = 20, guidance_scale = 7.5, seed, style } = params;

    try {
      const fullPrompt = style ? `${style}风格，${prompt}` : prompt;

      const requestBody = {
        model: this.model,
        prompt: fullPrompt,
        negative_prompt: negative_prompt || '',
        size: `${width}x${height}`,
        n: 1,
        response_format: 'url',
      };

      if (steps) requestBody.steps = steps;
      if (guidance_scale) requestBody.guidance_scale = guidance_scale;
      if (seed !== undefined) requestBody.seed = seed;

      console.error('[API 请求]', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(`${this.baseURL}/images/generations`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 120000,
      });

      const result = response.data;
      console.error('[API 响应]', JSON.stringify(result, null, 2));

      if (result.data?.[0]) {
        const imageData = result.data[0];

        if (!imageData.url) {
          throw new Error('API 未返回图片 URL');
        }

        const savedPath = await this._downloadImage(imageData.url, prompt);

        if (!savedPath) {
          throw new Error('图片下载失败');
        }

        return {
          success: true,
          image_path: savedPath,
          revised_prompt: imageData.revised_prompt || fullPrompt,
          params: { prompt: fullPrompt, width, height, steps, guidance_scale, seed },
        };
      }

      throw new Error('API 返回的数据格式不正确');
    } catch (error) {
      console.error('[生成图片失败]', error.response?.data || error.message);

      if (error.response) {
        throw new Error(`API 调用失败: ${error.response.status} - ${error.response.data?.error?.message || error.response.statusText}`);
      }

      throw new Error(`生成图片失败: ${error.message}`);
    }
  }

  async _downloadImage(url, prompt) {
    try {
      const now = new Date();
      const timestamp = now.getTime();
      const dateStr = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
      const filename = `${dateStr}_${timestamp}.png`;
      const filepath = path.join(this.outputDir, filename);

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
      });

      await fs.writeFile(filepath, response.data);
      console.error(`[图片已保存] ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('[下载图片失败]', error.message);
      return null;
    }
  }
}
