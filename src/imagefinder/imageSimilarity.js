import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { pipeline, RawImage } from '@xenova/transformers';
import sharp from 'sharp';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { Embeddings } from '@langchain/core/embeddings';
const images = [
  'https://kf-ui.cdn-go.cn/weapp-image/latest/taixu/imagesIcon/icon-44.png',
  'https://kf-ui.cdn-go.cn/weapp-image/latest/taixu/imagesIcon/icon-43.png',
  'https://kf-ui.cdn-go.cn/weapp-image/latest/taixu/imagesIcon/icon-42.png',
  'https://kf-ui.cdn-go.cn/weapp-image/latest/taixu/imagesIcon/icon-41.png',
];
// --- 基础设置 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 配置信息 ---
const IMAGE_DIR = path.join(__dirname, 'image');
const DB_DIR = path.join(__dirname, 'faiss_db'); // Faiss数据库保存目录
const MODEL = 'Xenova/clip-vit-base-patch16';
const TASK = 'image-feature-extraction';

// --- 自定义嵌入类以适配LangChain ---
class TransformerEmbeddings extends Embeddings {
  constructor(extractor) {
    super();
    this.extractor = extractor;
  }

  async embedDocuments(texts) {
    // 本场景主要处理图片，此方法为满足接口要求
    return Promise.all(texts.map(text => this.embedQuery(text)));
  }

  async embedQuery(imageSource) {
    let imageBuffer;

    // 1. 根据图片源（URL或本地路径）获取图片缓冲区
    if (imageSource.startsWith('http')) {
      const response = await fetch(imageSource);
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      imageBuffer = await fs.readFile(imageSource);
    }

    // 2. 使用 sharp 确保图片是3通道RGB格式
    const processedBuffer = await sharp(imageBuffer)
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // 将透明背景替换为白色
      .toFormat('jpeg') // 转换为jpeg，确保是3通道
      .toBuffer();

    // 3. 将处理后的图像缓冲区转换为模型可接受的 RawImage 对象
    const rawImage = await RawImage.fromBlob(new Blob([processedBuffer]));

    // 4. 将 RawImage 对象传递给模型
    const result = await this.extractor(rawImage, {
      pooling: 'mean',
      normalize: true,
    });

    return Array.from(result.data);
  }
}

/**
 * 函数1：根据输入的图片源（本地路径或URL）列表生成特征向量并存入Faiss向量数据库。
 * @param {TransformerEmbeddings} embeddings - 嵌入模型实例。
 * @param {string[]} imageSources - 图片路径或URL的数组。
 */
async function generateAndStoreEmbeddings(embeddings, imageSources) {
  if (!imageSources || imageSources.length === 0) {
    console.log('未提供任何图片源，无法创建数据库。');
    return;
  }

  console.log(`正在创建或更新向量数据库，共 ${imageSources.length} 张图片...`);

  // 从图片源（路径或URL）创建Faiss数据库
  const vectorStore = await FaissStore.fromTexts(
    imageSources, // 使用图片路径或URL作为内容
    imageSources.map(src => ({ source: src })), // 元数据，保存原始源
    embeddings
  );

  // 保存数据库到磁盘
  await vectorStore.save(DB_DIR);
  console.log(`数据库已成功保存至: ${DB_DIR}`);
}

/**
 * 函数2：在Faiss数据库中检索相似图片。
 * @param {TransformerEmbeddings} embeddings - 嵌入模型实例。
 * @param {string} queryImagePath - 用于查询的图片路径。
 * @param {number} topK - 返回最相似结果的数量。
 */
async function findSimilarImages(embeddings, queryImagePath, topK = 5) {
  console.log(`\n正在从 ${DB_DIR} 加载向量数据库...`);
  const vectorStore = await FaissStore.load(DB_DIR, embeddings);

  console.log(`正在为查询图片生成特征向量: ${path.basename(queryImagePath)}`);
  const queryVector = await embeddings.embedQuery(queryImagePath);

  console.log('正在进行相似度检索...');
  // 使用向量进行相似度搜索，并返回分数
  const results = await vectorStore.similaritySearchVectorWithScore(
    queryVector,
    topK
  );

  console.log(
    `与 ${path.basename(queryImagePath)} 最相似的 ${results.length} 张图片:`
  );
  results.forEach(([doc, score], index) => {
    // Faiss返回的是距离，对于归一化向量，相似度 = (2 - 距离) / 2
    const similarity = (2 - score) / 2;
    console.log(
      `  ${index + 1}. ${path.basename(
        doc.pageContent
      )} (相似度: ${similarity.toFixed(4)})`
    );
  });

  return results;
}

async function saveAll() {
  // 1. 初始化模型
  console.log('正在初始化特征提取模型...');
  const extractor = await pipeline(TASK, MODEL);
  const embeddings = new TransformerEmbeddings(extractor);

  // 2. 基于顶部的 `images` 数组（网络图片URL）生成并存储特征向量
  await generateAndStoreEmbeddings(embeddings, images);
}

// --- 主执行函数 ---
async function run() {
  try {
    // 1. 初始化模型
    console.log('正在初始化特征提取模型...');
    const extractor = await pipeline(TASK, MODEL);
    const embeddings = new TransformerEmbeddings(extractor);
    // 3. 指定一张图片进行相似度比对
    const testImagePath = path.join(__dirname, 'test.png');
    await findSimilarImages(embeddings, testImagePath, 3);
  } catch (error) {
    console.error('发生错误:', error);
  }
}
saveAll();
// run();
