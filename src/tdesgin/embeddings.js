import { OllamaEmbeddings } from '@langchain/ollama';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
const directory = '../db/vector';
const JSON_SOURCE_FILE = './output/index.txt';
const start = async () => {
  try {
    const loader = new TextLoader(JSON_SOURCE_FILE);
    const docs = await loader.load();
    console.log(`成功加载${docs.length}个文档`);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await splitter.splitDocuments(docs);

    const embedding = new OllamaEmbeddings({
      model: 'bge-m3',
      baseUrl: 'http://localhost:11434',
    });

    const vectorStore = await FaissStore.fromDocuments(splitDocs, embedding);
    return await vectorStore.save(directory);
  } catch (error) {
    console.error('文档处理过程中出错:', error);
    throw error;
  }
};
start()
  .then(result => console.log('处理结果:', result))
  .catch(err => console.error('处理失败:', err));
