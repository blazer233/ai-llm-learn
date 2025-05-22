import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { model } from './config.js';
import readline from 'readline';

// 检测是否为中文的正则表达式
const isChineseRegex = /[\u4e00-\u9fa5]/;

const systemTemplate =
  '你是一个专业的翻译员，你的任务是将文本从{source_lang}翻译成{target_lang}。保持专业术语准确，保留原始格式。';
const humanTemplate = '请翻译这句话：{text}';

const outputParser = new StringOutputParser();

const chain = ChatPromptTemplate.fromMessages([
  ['system', systemTemplate],
  ['human', humanTemplate],
])
  .pipe(model)
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
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
async function startChat() {
  console.log('翻译助手已启动，输入"exit"退出\n');
  const askQuestion = () => {
    rl.question('请输入翻译的词: ', async query => {
      if (query.toLowerCase() === 'q') {
        rl.close();
        return;
      }

      try {
        console.log('\n思考中...');
        const startTime = Date.now();
        const response = await autoTranslate(query);
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`\n回答(耗时${elapsedTime}秒):`);
        console.log(response + '\n');
      } catch (error) {
        console.error('处理请求时出错:', error);
      }
      askQuestion(); // 继续下一个问题
    });
  };

  askQuestion();
}
startChat().catch(err => console.error('初始化失败:', err));
