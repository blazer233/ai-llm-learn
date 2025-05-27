import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { embedding } from './config.js';

const texts = [
  'LangChain 是一个用于构建 LLM 应用的框架。',
  'MemoryVectorStore 是一个基于内存的向量存储。',
  'OpenAIEmbeddings 用于将文本转换成向量。',
];
MemoryVectorStore.fromTexts(
  texts,
  texts.map(i => ({ id: i + 1 })),
  embedding
).then(res => {
  res
    .asRetriever(1)
    .invoke('OpenAIEmbeddings 是做什么的')
    .then(docs => {
      console.log(docs);
    });
});
