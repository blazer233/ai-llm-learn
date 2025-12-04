/**
 * LSB 隐写核心算法（前端版本）
 * 基于掘金文章实现，用于在图片中隐藏和提取文本信息
 */

/**
 * 获取数字的指定位
 * @param {number} number - 数字
 * @param {number} location - 位位置（0为最低位）
 * @returns {number} - 0 或 1
 */
function getBit(number, location) {
  return (number >> location) & 1;
}

/**
 * 设置数字的指定位
 * @param {number} number - 原数字
 * @param {number} location - 位位置
 * @param {number} bit - 要设置的值（0或1）
 * @returns {number} - 修改后的数字
 */
function setBit(number, location, bit) {
  return (number & ~(1 << location)) | (bit << location);
}

/**
 * 将数字转换为16位二进制数组
 * @param {number} num - 数字
 * @returns {Array<number>} - 16位二进制数组
 */
function getBitsFromNumber(num) {
  const bits = [];
  for (let i = 0; i < 16; i++) {
    bits.push(getBit(num, i));
  }
  return bits;
}

/**
 * 将消息转换为二进制位数组
 * @param {string} message - 消息字符串
 * @returns {Array<number>} - 二进制位数组
 */
function getMessageBits(message) {
  const bits = [];
  for (let i = 0; i < message.length; i++) {
    const code = message.charCodeAt(i);
    const charBits = getBitsFromNumber(code);
    bits.push(...charBits);
  }
  return bits;
}

/**
 * 从像素数据中读取16位组成一个数字
 * @param {Uint8ClampedArray} colors - 像素数据
 * @param {Array<number>} history - 已使用的位置历史
 * @returns {number} - 提取的数字
 */
function getNumberFromBits(colors, history) {
  let num = 0;
  for (let i = 0; i < 16; i++) {
    const loc = getNextLocation(history, colors.length);
    const bit = getBit(colors[loc], 0);
    num = setBit(num, i, bit);
  }
  return num;
}

/**
 * 获取下一个可用的像素通道位置（跳过Alpha通道）
 * @param {Array<number>} history - 已使用的位置
 * @param {number} total - 总长度
 * @returns {number} - 下一个位置
 */
function getNextLocation(history, total) {
  let next = history.length;
  
  // 跳过Alpha通道（每4个字节的第4个）
  while ((next + 1) % 4 === 0) {
    next++;
  }
  
  history.push(next);
  return next;
}

/**
 * 将消息编码到图片像素数据中
 * @param {Uint8ClampedArray} colors - 像素数据（RGBA格式）
 * @param {string} message - 要隐藏的消息
 */
function encodeMessage(colors, message) {
  // 首先编码消息长度（16位）
  let messageBits = getBitsFromNumber(message.length);
  
  // 然后编码消息内容（每个字符16位）
  messageBits = messageBits.concat(getMessageBits(message));
  
  // 检查容量
  const availablePixels = Math.floor(colors.length * 3 / 4); // RGB通道，跳过A
  if (messageBits.length > availablePixels) {
    throw new Error(
      `消息太长！可用容量: ${Math.floor(availablePixels / 16)} 字符，需要: ${message.length} 字符`
    );
  }
  
  // 编码到像素中
  const history = [];
  let pos = 0;
  
  while (pos < messageBits.length) {
    const loc = getNextLocation(history, colors.length);
    
    // 修改该通道的最低位
    colors[loc] = setBit(colors[loc], 0, messageBits[pos]);
    
    // 找到对应像素的Alpha通道，设置为255（确保不透明）
    let alphaLoc = loc;
    while ((alphaLoc + 1) % 4 !== 0) {
      alphaLoc++;
    }
    colors[alphaLoc] = 255;
    
    pos++;
  }
  
  return {
    messageLength: message.length,
    bitsUsed: messageBits.length,
    pixelsModified: history.length
  };
}

/**
 * 从图片像素数据中解码消息
 * @param {Uint8ClampedArray} colors - 像素数据（RGBA格式）
 * @returns {string} - 提取的消息
 */
function decodeMessage(colors) {
  const history = [];
  
  // 首先读取消息长度（16位）
  const messageSize = getNumberFromBits(colors, history);
  
  // 验证长度的合理性
  const maxSize = Math.floor(colors.length * 3 / 4 / 16);
  if (messageSize <= 0 || messageSize > maxSize) {
    throw new Error('未找到有效消息或消息已损坏');
  }
  
  // 读取消息内容
  const message = [];
  for (let i = 0; i < messageSize; i++) {
    const code = getNumberFromBits(colors, history);
    message.push(String.fromCharCode(code));
  }
  
  return message.join('');
}

/**
 * 计算图片可以隐藏的最大字符数
 * @param {number} width - 图片宽度
 * @param {number} height - 图片高度
 * @returns {number} - 最大字符数
 */
function calculateCapacity(width, height) {
  const totalPixels = width * height;
  const availableBits = totalPixels * 3; // RGB三个通道
  const headerBits = 16; // 消息长度占用16位
  const availableForMessage = availableBits - headerBits;
  return Math.floor(availableForMessage / 16); // 每个字符16位
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    encodeMessage,
    decodeMessage,
    calculateCapacity,
    getBit,
    setBit,
    getBitsFromNumber,
    getMessageBits,
    getNumberFromBits,
    getNextLocation
  };
}
