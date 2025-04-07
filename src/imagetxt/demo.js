import { ChatOllama } from '@langchain/ollama';

const model = new ChatOllama({
  baseUrl: 'http://localhost:11434',
  model: 'deepseek-r1:14b',
  temperature: 0.7,
});

const response = await model.invoke('请给我关于图片 icon-298.png 的一些描述');
console.log(response);
