import { ChatOllama } from '@langchain/ollama';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

const systemTemplate =
  '你是一个专业的翻译员，你的任务是将文本从{source_lang}翻译成{target_lang}。';
const humanTemplate = '请翻译这句话：{text}';

const chatPrompt2 = ChatPromptTemplate.fromMessages([
  ['system', systemTemplate],
  ['human', humanTemplate],
]);

const outputParser = new StringOutputParser(); // 输出字符串
const chatModel = new ChatOllama({
  baseUrl: 'http://localhost:11434',
  model: 'deepseek-r1:14b',
  streaming: false,
});

const chain = chatPrompt2.pipe(chatModel).pipe(outputParser);

const res = await chain.invoke({
  source_lang: '中文',
  target_lang: '英语',
  text: '这种结构化的信息有助于模型更好的理解上下文，从而更好的回答问题。',
});

console.log(res);
