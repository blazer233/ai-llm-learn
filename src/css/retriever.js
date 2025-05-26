import { OllamaEmbeddings } from '@langchain/ollama';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { LLMChainExtractor } from 'langchain/retrievers/document_compressors/chain_extract';
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual_compression';
import { HydeRetriever } from 'langchain/retrievers/hyde';
import { MultiQueryRetriever } from 'langchain/retrievers/multi_query';
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
你是一名专业的前端开发专家，专注于CSS样式实现。请严格遵循以下规则：

1. 嵌套元素处理规则：
- 当描述中包含"父级"、"包含"、"嵌套"等关系词时，必须构建正确的DOM层级结构
- 父元素属性应应用在父元素class上，子元素属性应用在子元素class上
- 示例输入："宽为24，高度为36，内边距为24的元素父级为高度为108，宽度为100%，颜色为红色的元素"
- 示例输出：
  <div class="h-108 w-100p bg-red">
    <div class="h-36 w-24 p-24"></div>
  </div>

2. 类名使用规则：
- 首先在 {document} 中查找与 "{query}" 需求匹配的类名
- 使用简洁的实用类名（如：w-24表示width:24px）
- 禁止重复定义已有类名的样式
- 找不到匹配类名时才新增样式（需添加注释说明）

3. 输出要求：
- 只输出完整的HTML代码
- 保持类名语义明确（如：bg-red、text-lg）
- 使用标准HTML结构，不要省略必要的闭合标签

4. 响应格式示例：
对于复杂嵌套需求，应按此格式输出：
<div class="[父元素类名]">
  <div class="[子元素类名]">
    <!-- 更多嵌套内容 -->
  </div>
</div>
`
);

let vectorStore;
let retriever;

// 初始化检索器
const initRetriever = async () => {
  vectorStore = await FaissStore.load(directory, embedding);
  retriever = MultiQueryRetriever.fromLLM({
    llm: model,
    retriever: vectorStore.asRetriever(5),
    verbose: true,
  });
  // retriever = new HydeRetriever({
  //   llm: model,
  //   vectorStore,
  //   verbose: true,
  // });
  // retriever = new ContextualCompressionRetriever({
  //   baseCompressor: LLMChainExtractor.fromLLM(model),
  //   baseRetriever: vectorStore.asRetriever(5),
  //   // verbose: true,
  // });
};

const search = async query => {
  const docs = await retriever.invoke(query);
  const documentContent = docs.map(d => d.pageContent).join('\n\n');

  // 使用模型回调获取真实Token数
  let inputTokens = 0;
  let outputTokens = 0;

  const callbacks = [
    {
      handleLLMStart: (_, prompts) => {
        inputTokens = Math.ceil(JSON.stringify(prompts).length / 4);
      },
      handleLLMEnd: output => {
        outputTokens =
          output.llmOutput?.eval_count ||
          output.llmOutput?.tokenUsage?.totalTokens ||
          Math.ceil(output.generations[0][0].text.length / 4);
      },
    },
  ];

  const formattedResult = await promptTemplate
    .pipe(model)
    .pipe(outputParser)
    .invoke(
      {
        query,
        document: documentContent,
      },
      { callbacks }
    );

  return {
    content: formattedResult,
    tokens: {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens,
    },
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

        console.log(
          `\n回答(耗时${elapsedTime}秒, 消耗token: ${response.tokens.total})`
        );
        console.log(
          `输入token: ${response.tokens.input}, 输出token: ${response.tokens.output}`
        );
        console.log(response.content + '\n');
      } catch (error) {
        console.error('处理请求时出错:', error);
      }
      askQuestion(); // 继续下一个问题
    });
  };

  askQuestion();
}
startChat().catch(err => {
  console.error('初始化失败:', err);
  process.exit(0);
});
// FaissStore.load(directory, embedding).then(res => {
//   res
//     .asRetriever(3)
//     .invoke('宽为24，高度为36，内边距为24的元素，父级为高度为108，宽度为100%，颜色为红色的元素')
//     .then(docs => {
//       console.log(docs);
//       process.exit(0);
//     });
// });
