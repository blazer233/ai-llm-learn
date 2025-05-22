import { ChatDeepSeek } from '@langchain/deepseek';
import { ChatOllama } from '@langchain/ollama';
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
