import 'dotenv/config';

export const modelConfigs = {
  // 千问模型配置
  qianwen: {
    name: 'qianwen',
    displayName: '通义千问',
    apiKey: process.env.QIANWEN_API_KEY,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-vl-max-latest',
    description: '阿里云通义千问视觉模型',
    enabled: true,
  },

  // 智谱模型配置
  zhipu: {
    name: 'zhipu',
    displayName: '智谱GLM',
    apiKey: process.env.ZHIPU_API_KEY,
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
    model: 'glm-4.1v-thinking-flashx',
    description: '智谱AI GLM视觉模型',
    enabled: true,
  },
  // 混元模型配置
  hunyuan: {
    name: 'hunyuan',
    displayName: 'HunYuan',
    apiKey: process.env.HUNYUAN_API_KEY,
    baseURL: 'http://hunyuanapi.woa.com/openapi/v1/',
    model: 'hunyuan-t1-vision-latest',
    description: 'HunYuan AI Vision Model',
    enabled: true,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.HUNYUAN_API_KEY}`,
      Wsid: 10144,
    },
  },
  // 深seek模型配置
  deepseek: {
    name: 'deepseek',
    displayName: 'DeepSeek',
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com/v1/',
    model: 'deepseek-vl-chat',
    description: 'DeepSeek AI Vision Model',
    enabled: true,
  },
};
