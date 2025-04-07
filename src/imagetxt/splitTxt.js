import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { TextLoader } from 'langchain/document_loaders/fs/text';

const loader = new TextLoader('./image_descriptions.txt');
const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 64,
  chunkOverlap: 0,
});

const splitDocs = await splitter.splitDocuments(docs);
console.log(splitDocs);
