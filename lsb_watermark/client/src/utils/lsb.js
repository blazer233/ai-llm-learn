/**
 * LSB 隐写核心算法（精简版）
 */

function getBit(number, location) {
  return (number >> location) & 1;
}

function setBit(number, location, bit) {
  return (number & ~(1 << location)) | (bit << location);
}

function getBitsFromNumber(num) {
  const bits = [];
  for (let i = 0; i < 16; i++) {
    bits.push(getBit(num, i));
  }
  return bits;
}

function stringToUtf8Bytes(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

function utf8BytesToString(bytes) {
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

function getMessageBits(message) {
  const bits = [];
  const utf8Bytes = stringToUtf8Bytes(message);
  
  for (let i = 0; i < utf8Bytes.length; i++) {
    // 每个字节用 8 位表示
    for (let j = 0; j < 8; j++) {
      bits.push(getBit(utf8Bytes[i], j));
    }
  }
  return bits;
}

function getNextLocation(history, total) {
  // 使用 history 中的最后一个位置 + 1，而不是 history.length
  let next = history.length > 0 ? history[history.length - 1] + 1 : 0;
  
  // 跳过 Alpha 通道（每 4 个字节的第 4 个）
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
export function encodeMessage(colors, message) {
  console.log('编码前消息长度:', message.length);
  console.log('编码前消息内容:', message);
  console.log('前 100 个像素字节:', Array.from(colors.slice(0, 100)).map(b => b.toString(16).padStart(2, '0')).join(' '));
  
  // 转换为 UTF-8 字节
  const utf8Bytes = stringToUtf8Bytes(message);
  const byteLength = utf8Bytes.length;
  
  console.log('UTF-8 字节长度:', byteLength);
  console.log('前 20 个UTF-8字节:', Array.from(utf8Bytes.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
  
  // 首先编码字节长度（16位）
  let messageBits = getBitsFromNumber(byteLength);
  
  // 然后编码消息内容（每个字节8位）
  messageBits = messageBits.concat(getMessageBits(message));
  
  // 检查容量
  const availablePixels = Math.floor(colors.length * 3 / 4);
  if (messageBits.length > availablePixels) {
    throw new Error(
      `消息太长！可用位数: ${availablePixels}，需要: ${messageBits.length} 位`
    );
  }
  
  console.log('总位数:', messageBits.length, '可用位数:', availablePixels);
  console.log('前 32 位:', messageBits.slice(0, 32).join(''));
  
  // 编码到像素中
  const history = [];
  let pos = 0;
  
  while (pos < messageBits.length) {
    const loc = getNextLocation(history, colors.length);
    
    // 修改该通道的最低位
    colors[loc] = setBit(colors[loc], 0, messageBits[pos]);
    
    // 找到对应像素的 Alpha 通道，设置为 255（确保不透明）
    let alphaLoc = loc;
    while ((alphaLoc + 1) % 4 !== 0) {
      alphaLoc++;
    }
    colors[alphaLoc] = 255;
    
    pos++;
  }
  
  console.log('编码完成，修改了', history.length, '个通道');
  console.log('编码后前 100 个像素字节:', Array.from(colors.slice(0, 100)).map(b => b.toString(16).padStart(2, '0')).join(' '));
  
  return {
    byteLength: byteLength,
    bitsUsed: messageBits.length,
    pixelsModified: history.length
  };
}

function getNumberFromBits(colors, history, bitCount = 16) {
  let num = 0;
  for (let i = 0; i < bitCount; i++) {
    const loc = getNextLocation(history, colors.length);
    const bit = getBit(colors[loc], 0);
    num = setBit(num, i, bit);
  }
  return num;
}

/**
 * 从图片像素数据中解码消息
 * @param {Uint8ClampedArray} colors - 像素数据（RGBA格式）
 * @returns {string} - 提取的消息
 */
export function decodeMessage(colors) {
  const history = [];
  
  // 首先读取字节长度（16位）
  const byteLength = getNumberFromBits(colors, history, 16);
  
  // 验证长度的合理性
  const maxBytes = Math.floor(colors.length * 3 / 4 / 8);
  if (byteLength <= 0 || byteLength > maxBytes) {
    throw new Error('未找到有效消息或消息已损坏');
  }
  
  console.log('解码字节长度:', byteLength);
  
  // 读取消息字节
  const bytes = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i++) {
    bytes[i] = getNumberFromBits(colors, history, 8);
  }
  
  // 转换为字符串
  const message = utf8BytesToString(bytes);
  console.log('解码后消息:', message);
  
  return message;
}

/**
 * 计算图片可以隐藏的最大字节数
 */
export function calculateCapacity(width, height) {
  const totalPixels = width * height;
  const availableBits = totalPixels * 3;
  const headerBits = 16;
  const availableForMessage = availableBits - headerBits;
  return Math.floor(availableForMessage / 8);
}
