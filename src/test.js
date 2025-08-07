import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Ollama } from '@langchain/ollama';
import { embedding } from './config.js';
import fs from 'fs/promises'; // 新增fs模块导入

const testEmbedding = () => {
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
};

const testLlava = async () => {
  const ollama = new Ollama({
    baseUrl: 'http://localhost:11434',
    model: 'llava:latest',
  });
  try {
    // 使用fs直接读取图片文件
    const imagePath = new URL('./test.png', import.meta.url).pathname;
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    ollama
      .bind({ images: [base64Image] })
      .invoke('请用中文详细描述这张图片的内容')
      .then(res => {
        console.log(res);
      });
  } catch (error) {
    console.log(error);
  }
};

// testLlava();
// testEmbedding();
