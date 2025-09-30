import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { LLMChainExtractor } from "langchain/retrievers/document_compressors/chain_extract";
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";
import { HydeRetriever } from "langchain/retrievers/hyde";
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { embedding, model } from "../config.js";
import { directory } from "./common.js";
import readline from "readline";
import "dotenv/config";

const outputParser = new StringOutputParser();

const promptTemplate = PromptTemplate.fromTemplate(
  `
你是腾讯客服前端团队的资深开发专家，熟悉团队的原子CSS样式标准。请严格遵循以下规则：

## 核心原则
- **优先使用团队CSS标准**：必须从 {document} 中查找匹配的类名，这是我们团队多年沉淀的样式库
- **禁止使用外部框架**：不得使用Tailwind、Bootstrap等第三方框架的类名
- **语义化命名**：理解我们的命名规范（如：w-24=width:24px, bg-red=红色背景, at-center=居中）

## 常见布局模式识别
- **圣杯布局/三栏布局**：使用flex布局 + 定位类名实现左右固定、中间自适应
- **卡片布局**：组合背景色、圆角、阴影、内边距类名
- **居中布局**：优先使用 at-center 集合属性
- **客服对话框**：使用消息气泡相关的背景色和圆角类名

## 类名匹配策略
1. **精确匹配**：在 {document} 中寻找与 "{query}" 完全匹配的功能
2. **语义匹配**：理解需求本质，找到对应的样式组合
3. **组合使用**：多个简单类名组合实现复杂效果
4. **集合属性优先**：优先使用 at-* 开头的集合属性类名

## 嵌套结构处理
- 识别父子关系关键词："包含"、"嵌套"、"里面"、"内部"
- 父元素负责容器样式（宽高、背景、定位）
- 子元素负责内容样式（文字、图标、间距）

## 输出格式要求
- **仅输出HTML代码**：不要添加任何解释文字
- **完整标签结构**：确保所有标签正确闭合
- **类名组合合理**：按功能分组，便于阅读维护

## 示例参考
输入："做个居中的红色按钮"
输出：<div class="at-center bg-red p-12 radius-4">按钮</div>

输入："三栏布局，左右200px，中间自适应"
输出：
<div class="flex">
  <div class="w-200 bg-f5f6fa">左侧</div>
  <div class="flex-1 bg-white">中间内容</div>
  <div class="w-200 bg-f5f6fa">右侧</div>
</div>
`
);

let vectorStore;
let retriever;

// 初始化检索器
const initRetriever = async () => {
  vectorStore = await FaissStore.load(directory, embedding);
  // retriever = vectorStore.asRetriever(5);
  // retriever = MultiQueryRetriever.fromLLM({
  //   llm: model,
  //   retriever: vectorStore.asRetriever(5),
  //   verbose: true,
  // });
  retriever = new HydeRetriever({
    llm: model,
    vectorStore,
    verbose: true,
  });
  // retriever = new ContextualCompressionRetriever({
  //   baseCompressor: LLMChainExtractor.fromLLM(model),
  //   baseRetriever: vectorStore.asRetriever(5),
  //   // verbose: true,
  // });
};

const search = async (query) => {
  const docs = await retriever.invoke(query);
  const documentContent = docs.map((d) => d.pageContent).join("\n\n");

  // 使用模型回调获取真实Token数
  let inputTokens = 0;
  let outputTokens = 0;

  const callbacks = [
    {
      handleLLMStart: (_, prompts) => {
        inputTokens = Math.ceil(JSON.stringify(prompts).length / 4);
      },
      handleLLMEnd: (output) => {
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
    rl.question("您想实现什么功能？: ", async (query) => {
      if (query.toLowerCase() === "q") {
        rl.close();
        return;
      }

      try {
        console.log("\n思考中...");
        const startTime = Date.now();
        const response = await search(query);
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(
          `\n回答(耗时${elapsedTime}秒, 消耗token: ${response.tokens.total})`
        );
        console.log(
          `输入token: ${response.tokens.input}, 输出token: ${response.tokens.output}`
        );
        console.log(response.content + "\n");
      } catch (error) {
        console.error("处理请求时出错:", error);
      }
      askQuestion(); // 继续下一个问题
    });
  };

  askQuestion();
}
startChat().catch((err) => {
  console.error("初始化失败:", err);
  process.exit(0);
});