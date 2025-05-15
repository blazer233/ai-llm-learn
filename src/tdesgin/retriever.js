import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { LLMChainExtractor } from 'langchain/retrievers/document_compressors/chain_extract';
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual_compression';

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

const search = async txt => {
  const vectorStore = await FaissStore.load(directory, embedding);
  // 1 从向量数据库中创建一个检索器
  // 直接从向量数据库创建基础检索器
  // 简单返回与查询最相关的2个文档
  // 不进行额外的处理或优化
  // 性能更高但结果可能不够精确
  // const retriever = vectorstore.asRetriever(2);

  //2 上下文压缩检索器
  // 先用基础检索器获取初步结果
  // 再用LLM（qwen2.5:7b模型）压缩/提炼结果
  // 可以过滤掉不相关信息，提高结果质量
  // 由于需要调用LLM，速度会比基础检索器慢
  const retriever = new ContextualCompressionRetriever({
    baseCompressor: LLMChainExtractor.fromLLM(model),
    baseRetriever: vectorStore.asRetriever(6),
    queryCount: 4,
    verbose: true,
  });

  return await retriever.invoke(txt);
};
search('帮忙实现一个动态form表单').then(res => {
  console.log(res);
});
