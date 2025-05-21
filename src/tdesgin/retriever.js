import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { LLMChainExtractor } from 'langchain/retrievers/document_compressors/chain_extract';
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual_compression';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatDeepSeek } from '@langchain/deepseek';
import readline from 'readline';
import 'dotenv/config';

const outputParser = new StringOutputParser();
const directory = '../db/vector';

const model = new ChatDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY, // 从环境变量获取API key
  model: 'deepseek-chat', // 指定DeepSeek模型
  temperature: 0.2,
});

// const model = new ChatOllama({
//   baseUrl: 'http://localhost:11434',
//   model: process.env.MODEL_NAME,
//   temperature: 0.2,
// });

const embedding = new OllamaEmbeddings({
  model: 'bge-m3',
  baseUrl: 'http://localhost:11434',
});

const promptTemplate = PromptTemplate.fromTemplate(
  `
你是一名专业的 React 前端开发专家，专注于使用 TDesign 组件库开发。请严格遵循以下要求：

1. 代码实现要求：
- 仅使用 tdesign-react、tdesign-icons-react 这两个库，如果有使用 lodash-es 库的地方，则将对应的方法转为js的原生方法
- 完全基于提供的 {document} 中的代码示例和描述
- 实现 "{query}" 中描述的功能需求
- 确保代码符合 React 最佳实践

2. 输出格式要求：
- 只输出完整的代码块，不要包含任何解释或额外文本
- 代码格式整洁，包含必要的注释（使用中文注释）
- 如果是组件代码，需要是可直接运行的完整组件

3. 特别注意事项：
- 不添加任何超出指定库的功能
- 保持代码简洁高效
- 遵循 TDesign 的设计规范
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

const search = async query => {
  const docs = await retriever.invoke(query);
  const formattedResult = await promptTemplate
    .pipe(model)
    .pipe(outputParser)
    .invoke({
      query,
      document: docs.map(d => d.pageContent).join('\n\n'),
    });
  return formattedResult;
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 启动问答循环
async function startChat() {
  await initRetriever();
  console.log('TDesign eact开发助手已启动，输入"exit"退出\n');

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
// FaissStore.load(directory, embedding).then(res => {
//   res
//     .asRetriever(5)
//     .invoke('实现一个动态表单')
//     .then(docs => {
//       console.log(docs);
//       process.exit(0);
//     });
// });
