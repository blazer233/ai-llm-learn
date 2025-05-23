import { OllamaEmbeddings } from '@langchain/ollama';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { LLMChainExtractor } from 'langchain/retrievers/document_compressors/chain_extract';
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual_compression';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { model } from '../config.js';
import { directory } from './common.js';
import readline from 'readline';
import 'dotenv/config';

const outputParser = new StringOutputParser();

const embedding = new OllamaEmbeddings({
  model: 'bge-m3',
  baseUrl: 'http://localhost:11434',
});

const promptTemplate = PromptTemplate.fromTemplate(
  `
你是一名专业的前端开发专家，专注于css样式。请严格遵循以下要求：

1. 代码实现要求：
- 完全基于提供的 {document} 中的类名和描述
- 实现 "{query}" 中描述的功能需求
- 如果实现的样式在 {document} 中没有描述，请使用通用的css属性，如果有描述，请直接使用对应的类名，无需再<style>中添加
- 确保代码符合前端开发最佳实践

2. 输出格式要求：
- 只输出完整的HTML代码，不要包含任何解释或额外文本
- 代码格式整洁，包含必要的注释（使用中文注释）
- 如果是组件代码，需要是可直接运行的完整组件

3. 特别注意事项：
- 不添加任何第三方库
- 保持代码简洁高效
`
);

let vectorStore;
let retriever;

// 初始化检索器
const initRetriever = async () => {
  vectorStore = await FaissStore.load(directory, embedding);
  retriever = new ContextualCompressionRetriever({
    baseCompressor: LLMChainExtractor.fromLLM(model),
    baseRetriever: vectorStore.asRetriever(5),
    queryCount: 4,
    verbose: true,
  });
};

// 计算字符串的近似token数 (1个token≈4个英文字符)
const countTokens = (text) => Math.ceil(text.length / 4);

const search = async query => {
  const docs = await retriever.invoke(query);
  const documentContent = docs.map(d => d.pageContent).join('\n\n');
  
  // 计算输入token数
  const inputTokens = countTokens(query) + countTokens(documentContent);
  
  const formattedResult = await promptTemplate
    .pipe(model)
    .pipe(outputParser)
    .invoke({
      query,
      document: documentContent,
    });
  
  // 计算输出token数
  const outputTokens = countTokens(formattedResult);
  
  return {
    content: formattedResult,
    tokens: {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens
    }
  };
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 启动问答循环
async function startChat() {
  await initRetriever();
  console.log('css 开发助手已启动，输入"exit"退出\n');

  const askQuestion = () => {
    rl.question('您想实现什么功能？: ', async query => {
      if (query.toLowerCase() === 'q') {
        rl.close();
        return;
      }

      try {
        console.log('\n思考中...');
        const startTime = Date.now();
        const response = await search(query);
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`\n回答(耗时${elapsedTime}秒, 消耗token: ${response.tokens.total})`);
        console.log(`输入token: ${response.tokens.input}, 输出token: ${response.tokens.output}`);
        console.log(response.content + '\n');
      } catch (error) {
        console.error('处理请求时出错:', error);
      }
      askQuestion(); // 继续下一个问题
    });
  };

  askQuestion();
}
startChat().catch(err => console.error('初始化失败:', err));
// FaissStore.load(directory, embedding).then(res => {
//   res
//     .asRetriever(5)
//     .invoke('实现一个动态表单')
//     .then(docs => {
//       console.log(docs);
//       process.exit(0);
//     });
// });
