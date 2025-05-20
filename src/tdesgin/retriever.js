import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { LLMChainExtractor } from 'langchain/retrievers/document_compressors/chain_extract';
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual_compression';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import readline from 'readline';

const outputParser = new StringOutputParser();
const directory = '../db/vector';

const model = new ChatOllama({
  baseUrl: 'http://localhost:11434',
  model: 'qwen2.5:7b',
  temperature: 0.7,
});

const embedding = new OllamaEmbeddings({
  model: 'bge-m3',
  baseUrl: 'http://localhost:11434',
});

const promptTemplate = PromptTemplate.fromTemplate(
  `你是一个专业的react前端开发，你的任务是参考{document}中的代码以及相关描述，结合你自身的react知识，
  实现"{query}"中提出的功能，请勿引入除tdesign-react之外的其他库，输出代码块，不要输出其他内容。`
);

let vectorStore;
let retriever;

// 初始化检索器
const initRetriever = async () => {
  vectorStore = await FaissStore.load(directory, embedding);
  retriever = new ContextualCompressionRetriever({
    baseCompressor: LLMChainExtractor.fromLLM(model),
    baseRetriever: vectorStore.asRetriever(5),
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
  console.log('React开发助手已启动，输入"exit"退出\n');

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
