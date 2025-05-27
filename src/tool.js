import { readFile } from 'fs/promises';

/**
 * 读取JSON或文本文件
 * @param {string} filePath - 相对于调用者文件的路径
 * @param {string} callerUrl - 调用者模块的 import.meta.url
 * @param {boolean} [json=true] - 是否解析为JSON
 * @returns {Promise<Object|string>} 文件内容
 */
export async function readJsonFile(filePath, callerUrl) {
  let retData = null;
  try {
    // 通过 URL 解析绝对路径
    const absoluteUrl = new URL(filePath, callerUrl);
    const data = await readFile(absoluteUrl, 'utf8');
    try {
      retData = JSON.parse(data);
    } catch (error) {
      retData = data;
    }
    return retData;
  } catch (error) {
    error.message = `读取文件失败 (${filePath}): ${error.message}`;
    throw error;
  }
}
