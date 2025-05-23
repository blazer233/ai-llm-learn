import { TencentHunyuanEmbeddings } from '@langchain/community/embeddings/tencent_hunyuan';
import { ChatDeepSeek } from '@langchain/deepseek';
import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import 'dotenv/config';

export const SPLIT_SIGN = '===SPLIT===';

export const model = new ChatOllama({
  baseUrl: 'http://localhost:11434',
  model: process.env.MODEL_NAME,
  temperature: 0.2,
});
// export const model = new ChatDeepSeek({
//   apiKey: process.env.DEEPSEEK_API_KEY, // 从环境变量获取API key
//   model: 'deepseek-chat', // 指定DeepSeek模型
//   temperature: 0.2,
// });
export const embedding = new OllamaEmbeddings({
  model: 'bge-m3',
  baseUrl: 'http://localhost:11434',
});
// export const embedding = new TencentHunyuanEmbeddings({
//   model: 'hunyuan-embedding',
//   streaming: false,
//   tencentSecretId: process.env.HUNYUAN_ID,
//   tencentSecretKey: process.env.HUNYUAN_KEY,
// });
// export const embedding = new AlibabaTongyiEmbeddings({
//   apiKey: process.env.QWEN_API_KEY,
//   modelName: 'text-embedding-v3',
// });
