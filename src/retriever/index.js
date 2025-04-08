import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { MultiQueryRetriever } from 'langchain/retrievers/multi_query';
import { OllamaEmbeddings } from '@langchain/ollama';
import { ChatOllama } from '@langchain/ollama';
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual_compression';
import { LLMChainExtractor } from 'langchain/retrievers/document_compressors/chain_extract';

const model = new ChatOllama({
  baseUrl: 'http://localhost:11434',
  model: 'qwen2.5:7b',
});

// 将文本转换为高维向量（嵌入向量）
const embeddings = new OllamaEmbeddings({
  model: 'bge-m3',
  baseUrl: 'http://localhost:11434',
});

async function mainMulti(query) {
  try {
    const vectorstore = await MemoryVectorStore.fromTexts(
      [
        '建筑物由砖块建成',
        '建筑物由木材建成',
        '建筑物由石头建成',
        '汽车由金属制成',
        '汽车由塑料制成',
        '线粒体是细胞的工厂',
        '线粒体由脂质构成',
      ],
      [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
        { id: 6 },
        { id: 7 },
      ],
      embeddings
    );
    const retriever = MultiQueryRetriever.fromLLM({
      llm: model,
      retriever: vectorstore.asRetriever(),
      queryCount: 4,
    });

    return await retriever.invoke(query);
  } catch (error) {
    console.error('发生错误:', error);
  }
}

async function mainContextual(query) {
  try {
    const vectorstore = await MemoryVectorStore.fromTexts(
      [
        '建筑物由砖块建成',
        '建筑物由木材建成',
        '建筑物由石头建成',
        '汽车由金属制成',
        '汽车由塑料制成',
        '线粒体是细胞的工厂',
        '线粒体由脂质构成',
      ],
      [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
        { id: 6 },
        { id: 7 },
      ],
      embeddings
    );

    const compressor = LLMChainExtractor.fromLLM(model);
    const retriever = new ContextualCompressionRetriever({
      baseCompressor: compressor,
      baseRetriever: vectorstore.asRetriever(2),
    });
    return await retriever.invoke(query);
  } catch (error) {
    console.error('发生错误:', error);
  }
}
mainMulti('线粒体是由什么组成的？').then(res => {
  console.log('MultiQueryRetriever', res);
  // 调用 main 函数
  mainContextual('线粒体是由什么组成的？').then(ret => {
    console.log('ContextualCompressionRetriever', ret);
  });
});
