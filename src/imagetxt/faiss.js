import { OllamaEmbeddings } from '@langchain/ollama';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const directory = './db/vector';

const embedding = new OllamaEmbeddings({
  model: 'bge-m3',
  baseUrl: 'http://localhost:11434',
});

const save = async () => {
  const loader = new TextLoader('./image_descriptions.txt');
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100, // 分块的大小
    chunkOverlap: 20, // 块之间的重叠
  });
  const splitDocs = await splitter.splitDocuments(docs);

  //加载向量储存
  const vectorstore = await FaissStore.fromDocuments(splitDocs, embedding);
  return await vectorstore.save(directory);
};

const search = async txt => {
  const vectorstore = await FaissStore.load(directory, embedding);
  //从向量数据库中创建一个检索器
  const retriever = vectorstore.asRetriever(2);
  //使用Runnable API进行进行检索
  const results = await retriever.invoke(txt);
  return results;
};

// save().then(() => {
//   console.log('向量储存成功');
// });

search('icon-298.png 这张图片的描述是什么').then(res => {
  console.log(res);
});
