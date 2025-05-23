import { TextSplitter } from 'langchain/text_splitter';

export class CustomDelimiterTextSplitter extends TextSplitter {
  /**
   * @param {string} delimiter 自定义分割标记
   * @param {number} chunkSize 块大小，默认1000
   * @param {number} chunkOverlap 重叠大小，默认0
   */
  constructor(delimiter, chunkSize = 1000, chunkOverlap = 200) {
    super({ chunkSize, chunkOverlap });
    this.delimiter = delimiter;
  }

  /**
   * 按自定义分割标记拆分文本，并对超长块做 chunkSize 拆分
   * @param {string} text 输入文本
   * @returns {Promise<string[]>} 拆分后的文本块数组
   */
  async splitText(text) {
    // 1. 按分割标记拆分
    let splits = text
      .split(this.delimiter)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    const finalChunks = [];

    for (const split of splits) {
      if (split.length <= this.chunkSize) {
        finalChunks.push(split);
      } else {
        const subChunks = this._splitByChunkSize(split);
        finalChunks.push(...subChunks);
      }
    }

    return finalChunks;
  }

  /**
   * 按 chunkSize 和 chunkOverlap 拆分字符串
   * @param {string} text
   * @returns {string[]}
   */
  _splitByChunkSize(text) {
    const chunks = [];
    const chunkSize = this.chunkSize;
    const chunkOverlap = this.chunkOverlap;

    let start = 0;
    while (start < text.length) {
      let end = start + chunkSize;
      if (end > text.length) {
        end = text.length;
      }
      const chunk = text.slice(start, end);
      chunks.push(chunk);

      start += chunkSize - chunkOverlap;
      if (start < 0) {
        start = 0;
      }
    }

    return chunks;
  }
}
