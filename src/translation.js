import { ChatOllama } from '@langchain/ollama';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

// 检测是否为中文的正则表达式
const isChineseRegex = /[\u4e00-\u9fa5]/;

const systemTemplate =
  '你是一个专业的翻译员，你的任务是将文本从{source_lang}翻译成{target_lang}。保持专业术语准确，保留原始格式。';
const humanTemplate = '请翻译这句话：{text}';

const outputParser = new StringOutputParser();
const chatModel = new ChatOllama({
  baseUrl: 'http://localhost:11434',
  model: 'qwen2.5:7b',
});

const chain = ChatPromptTemplate.fromMessages([
  ['system', systemTemplate],
  ['human', humanTemplate],
])
  .pipe(chatModel)
  .pipe(outputParser);

async function autoTranslate(text) {
  // 检测输入语言
  const isChinese = isChineseRegex.test(text);
  const sourceLang = isChinese ? '中文' : '其他语言';
  const targetLang = isChinese ? '英语' : '中文';

  const res = await chain.invoke({
    source_lang: sourceLang,
    target_lang: targetLang,
    text: text,
  });

  return res;
}

const example = await autoTranslate('systemTemplate');
console.log(example); // 输出中文翻译
