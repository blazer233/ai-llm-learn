import { OllamaEmbeddings } from '@langchain/ollama';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
const directory = '../db/vector';

const loader = new JSONLoader('./output/index.json');

const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 50,
});
const splitDocs = await splitter.splitDocuments(docs);

// 将文本转换为高维向量（嵌入向量）
const embedding = new OllamaEmbeddings({
  model: 'bge-m3',
  baseUrl: 'http://localhost:11434',
});

const vectorStore = await FaissStore.fromDocuments(splitDocs, embedding);
await vectorStore.save(directory);
console.log('向量存储成功');
