import { TencentHunyuanEmbeddings } from '@langchain/community/embeddings/tencent_hunyuan';
import { AlibabaTongyiEmbeddings } from '@langchain/community/embeddings/alibaba_tongyi';
import { ChatDeepSeek } from '@langchain/deepseek';
import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import 'dotenv/config';

export const SPLIT_SIGN = '===SPLIT===';

/**
 * 语言模型 model
 */
// 本地模型
export const model = new ChatOllama({
  baseUrl: 'http://localhost:11434',
  model: process.env.MODEL_NAME,
});

// DeepSeek 模型
// export const model = new ChatDeepSeek({
//   apiKey: process.env.DEEPSEEK_API_KEY, // 从环境变量获取API key
//   model: 'deepseek-chat', // 指定DeepSeek模型
// });

// 华为云模型
// export const model = new ChatOpenAI({
//   model: 'DeepSeek-V3',
//   openAIApiKey: process.env.HUAWEI_KEY,
//   configuration: {
//     baseURL: 'https://api.modelarts-maas.com/v1',
//   },
// });

// 百度模型
// export const model = new ChatOpenAI({
//   model: 'DeepSeek-V3',
//   openAIApiKey: process.env.BAIDU_KEY,
//   configuration: {
//     baseURL: 'https://aistudio.baidu.com/llm/lmapi/v3',
//   },
// });

/**
 * 向量模型 embedding
 */

// 本地向量模型
// export const embedding = new OllamaEmbeddings({
//   model: 'bge-m3',
//   baseUrl: 'http://localhost:11434',
// });

// 百度向量模型
export const embedding = new OpenAIEmbeddings({
  model: 'embedding-v1',
  openAIApiKey: process.env.BAIDU_KEY,
  configuration: {
    baseURL: 'https://aistudio.baidu.com/llm/lmapi/v3',
  },
});

/**以下已欠费 */

// 腾讯云向量模型
// export const embedding = new TencentHunyuanEmbeddings({
//   model: 'hunyuan-embedding',
//   streaming: false,
//   tencentSecretId: process.env.HUNYUAN_ID,
//   tencentSecretKey: process.env.HUNYUAN_KEY,
// });

// 阿里云向量模型
// export const embedding = new AlibabaTongyiEmbeddings({
//   apiKey: process.env.QWEN_API_KEY,
//   modelName: 'text-embedding-v3',
// });
