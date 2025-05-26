// 引入集成检索器，用于将多个检索器组合起来进行检索
import { EnsembleRetriever } from 'langchain/retrievers/ensemble';
// 引入内存向量存储，可将文档存储为向量，便于后续检索操作
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
// 引入基础检索器类和其输入类型定义，为自定义检索器提供基础功能
import { BaseRetriever, BaseRetrieverInput } from '@langchain/core/retrievers';
// 引入文档类，用于表示存储的文本及其元数据
import { Document } from '@langchain/core/documents';
import { embedding } from './config.js';

// 自定义一个简单的检索器类，继承自 BaseRetriever
class SimpleCustomRetriever extends BaseRetriever {
  // 命名空间，可用于标识和组织检索器
  lc_namespace = [];
  // 用于存储待检索的文档数组
  documents;

  // 构造函数，接收包含文档数组和基础检索器输入的对象
  constructor(fields) {
    // 调用父类的构造函数
    super(fields);
    // 将传入的文档数组赋值给类的 documents 属性
    this.documents = fields.documents;
  }

  // 异步方法，用于获取与查询相关的文档
  async _getRelevantDocuments(query) {
    // 过滤文档数组，返回页面内容包含查询关键词的文档
    return this.documents.filter(document =>
      document.pageContent.includes(query)
    );
  }
}

// 定义第一组文档，每个文档包含页面内容和元数据
const docs1 = [
  new Document({ pageContent: '我喜欢苹果', metadata: { source: 1 } }),
  new Document({ pageContent: '我喜欢橙子', metadata: { source: 1 } }),
  new Document({ pageContent: '苹果和橙子都是水果', metadata: { source: 1 } }),
];

// 使用第一组文档创建一个简单的关键词检索器
const keywordRetriever = new SimpleCustomRetriever({ documents: docs1 });

// 定义第二组文档，同样包含页面内容和元数据
const docs2 = [
  new Document({ pageContent: '你喜欢苹果', metadata: { source: 2 } }),
  new Document({ pageContent: '你喜欢橙子', metadata: { source: 2 } }),
];

// 异步操作，从第二组文档和 OpenAI 嵌入创建内存向量存储
const vectorstore = await MemoryVectorStore.fromDocuments(docs2, embedding);

// 将向量存储转换为检索器
const vectorstoreRetriever = vectorstore.asRetriever();

// 创建集成检索器，将向量存储检索器和关键词检索器组合
const retriever = new EnsembleRetriever({
  // 要组合的检索器数组
  retrievers: [vectorstoreRetriever, keywordRetriever],
  // 每个检索器的权重，这里两个检索器权重相同
  weights: [0.5, 0.5],
});

// 定义查询关键词
const query = '苹果';
// 异步调用集成检索器进行查询，获取相关文档
const retrievedDocs = await retriever.invoke(query);

// 打印检索到的文档
console.log(retrievedDocs);

/*
  [
    Document { pageContent: '你喜欢苹果', metadata: { source: 2 } },
    Document { pageContent: '我喜欢苹果', metadata: { source: 1 } },
    Document { pageContent: '你喜欢橙子', metadata: { source: 2 } },
    Document {
      pageContent: '苹果和橙子都是水果',
      metadata: { source: 1 }
    }
  ]
*/
