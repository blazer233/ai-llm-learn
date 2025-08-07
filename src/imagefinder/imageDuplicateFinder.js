// 添加ES模块兼容的路径处理
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { Ollama } from 'ollama';
import fs from 'fs';
import path from 'path';
import { OllamaEmbeddings } from '@langchain/ollama';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ImageDuplicateFinder {
  constructor() {
    this.ollama = new Ollama({
      baseUrl: 'http://localhost:11434',
      model: 'llava:latest',
    });
    this.embeddings = new OllamaEmbeddings({
      baseUrl: 'http://localhost:11434',
      model: 'llava:latest',
    });
    this.dbPath = path.join(__dirname, 'faiss_db');
    this.vectorStore = null;
  }

  /**
   * 提取图片特征向量（优化版）
   * @param {string} imagePath - 图片文件路径
   * @returns {Promise<number[]>} - 特征向量
   */
  async extractImageFeatures(imagePath) {
    try {
      // 使用流式读取避免大内存占用
      const readStream = fs.createReadStream(imagePath);
      const chunks = [];

      for await (const chunk of readStream) {
        chunks.push(chunk);
      }

      const imageBuffer = Buffer.concat(chunks);
      const base64Image = imageBuffer.toString('base64');

      // 使用LLaVA模型提取特征
      const response = await this.ollama.embeddings({
        model: 'llava:latest',
        prompt: ' ', // A prompt is required, even if empty
        images: [base64Image],
      });

      if (!response?.embedding) {
        throw new Error('特征提取失败: 响应中缺少embedding');
      }

      console.log(
        `提取向量长度 ${response.embedding.length} - ${path.basename(
          imagePath
        )}`
      );
      return response.embedding;
    } catch (error) {
      console.error(
        `特征提取失败 [${path.basename(imagePath)}]:`,
        error.message
      );
      return null; // 返回null而不是抛出异常，便于批量处理
    }
  }

  /**
   * 初始化向量数据库（优化版）
   */
  async initializeVectorStore() {
    try {
      // 检查数据库目录是否存在
      await fs.promises.access(this.dbPath);

      // 尝试加载现有数据库
      this.vectorStore = await FaissStore.load(this.dbPath, this.embeddings);
      console.log('向量数据库加载成功');
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('数据库目录不存在，创建新的向量数据库');
      } else {
        console.error('数据库加载失败:', error.message);
      }

      // 确保目录存在
      await fs.promises.mkdir(this.dbPath, { recursive: true });

      // 创建维度为4096的新索引
      this.vectorStore = new FaissStore(this.embeddings, {
        dimensions: 4096,
      });
      console.log('新的向量数据库创建完成');
    }
  }

  /**
   * 存储图片向量到数据库
   * @param {string} imagePath - 图片路径
   * @param {string} imageName - 图片名称
   */
  async storeImageVector(imagePath, imageName) {
    const vector = await this.extractImageFeatures(imagePath);

    // 添加向量到数据库
    await this.vectorStore.addVectors(
      [vector],
      [
        {
          pageContent: imageName,
          metadata: { name: imageName, path: imagePath },
        },
      ]
    );

    console.log(`图片 ${imageName} 已存储到数据库`);
  }

  /**
   * 查找相似图片
   * @param {string} imagePath - 查询图片路径
   * @param {number} threshold - 相似度阈值(0-1)
   * @param {number} k - 返回结果数量
   * @returns {Promise<Array>} - 相似图片结果
   */
  async findSimilarImages(imagePath, threshold = 0.95, k = 5) {
    if (!this.vectorStore) {
      throw new Error('向量数据库未初始化');
    }

    const queryEmbedding = await this.extractImageFeatures(imagePath);
    // 验证特征向量是否有效
    if (
      !queryEmbedding ||
      !Array.isArray(queryEmbedding) ||
      queryEmbedding.length === 0
    ) {
      throw new Error(`findSimilarImages 特征提取失败: ${imagePath}`);
    }

    const results = await this.vectorStore.similaritySearchVectorWithScore(
      queryEmbedding,
      k
    );

    // 过滤低于阈值的结果
    return results
      .filter(([_, score]) => score >= threshold)
      .map(([doc, score]) => ({
        path: doc.metadata.path,
        similarity: score,
        metadata: doc.metadata,
      }));
  }

  /**
   * 保存向量数据库到文件
   * @param {string} savePath - 保存路径
   */
  async saveDatabase(savePath) {
    if (!this.vectorStore) {
      throw new Error('向量数据库未初始化');
    }
    await this.vectorStore.save(savePath);
  }

  /**
   * 从文件加载向量数据库
   * @param {string} loadPath - 加载路径
   */
  async loadDatabase(loadPath) {
    this.vectorStore = await FaissStore.load(loadPath, this.embeddings);
  }
}

export default ImageDuplicateFinder;
