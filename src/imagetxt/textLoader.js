import { TextLoader } from 'langchain/document_loaders/fs/text';
const loader = new TextLoader('./image_descriptions.txt');

const docs = await loader.load();
console.log(docs);
//loder 加载后返回的是一个Document对象数组，可以通过下标访问其中的Document对象
