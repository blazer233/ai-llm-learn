import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { CustomDelimiterTextSplitter } from './splitter.js';
import { directory, FILE_PATH } from './common.js';
import { embedding, SPLIT_SIGN } from '../config.js';

const start = async () => {
  try {
    const loader = new TextLoader(FILE_PATH);
    const docs = await loader.load();
    console.log(`成功加载${docs.length}个文档`);

    const splitter = new CustomDelimiterTextSplitter(SPLIT_SIGN);
    const splitDocs = await splitter.splitDocuments(docs);
    console.log('拆分完成：', splitDocs);

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
