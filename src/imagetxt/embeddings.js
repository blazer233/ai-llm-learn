import { OllamaEmbeddings } from '@langchain/ollama';
import { ChatOllama } from '@langchain/ollama';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual_compression';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { LLMChainExtractor } from 'langchain/retrievers/document_compressors/chain_extract';

const model = new ChatOllama({
  baseUrl: 'http://localhost:11434',
  model: 'qwen2.5:7b',
  temperature: 0.7,
});

// 将文本转换为高维向量（嵌入向量）
const embedding = new OllamaEmbeddings({
  model: 'bge-m3',
  baseUrl: 'http://localhost:11434',
});

const loader = new TextLoader('./image_descriptions.txt');
const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 100, // 分块的大小
  chunkOverlap: 0, // 块之间的重叠
});

const splitDocs = await splitter.splitDocuments(docs);

const vectorStore = await FaissStore.fromDocuments(splitDocs, embedding);
const compressor = LLMChainExtractor.fromLLM(model);
const retriever = new ContextualCompressionRetriever({
  baseCompressor: compressor,
  baseRetriever: vectorStore.asRetriever(2),
});

const res = await retriever.invoke('icon-298.png 这张图片的描述是什么');

console.log(res, 99);
