import '@tensorflow/tfjs-node';
import { load } from '@tensorflow-models/universal-sentence-encoder';
import { Embeddings } from '@langchain/core/embeddings';

export class UseEmbeddings extends Embeddings {
  model = null;

  async loadModel() {
    if (!this.model) {
      this.model = await load();
    }
  }

  /**
   * 输入字符串数组，返回对应的向量数组
   */
  async embedDocuments(texts) {
    await this.loadModel();
    if (!this.model) throw new Error('USE model not loaded');
    const embeddings = await this.model.embed(texts);
    const array = await embeddings.array();
    embeddings.dispose();
    return array;
  }

  /**
   * 输入单个字符串，返回对应的向量
   */
  async embedQuery(text) {
    const vectors = await this.embedDocuments([text]);
    return vectors[0];
  }
}
