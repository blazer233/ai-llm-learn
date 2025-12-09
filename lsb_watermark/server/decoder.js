const sharp = require('sharp');
const fs = require('fs');

/**
 * LSB 解码算法（Node.js版本）
 */

function getBit(number, location) {
  return (number >> location) & 1;
}

function setBit(number, location, bit) {
  return (number & ~(1 << location)) | (bit << location);
}

function getNextLocation(history, total) {
  // 使用 history 中的最后一个位置 + 1，而不是 history.length
  let next = history.length > 0 ? history[history.length - 1] + 1 : 0;
  
  // 跳过 Alpha 通道
  while ((next + 1) % 4 === 0) {
    next++;
  }
  history.push(next);
  return next;
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

function decodeMessage(colors) {
  const history = [];
  
  console.log('开始解码，前 32 个位置的 LSB:');
  const testHistory = [];
  const testBits = [];
  for (let i = 0; i < 32; i++) {
    const loc = getNextLocation(testHistory, colors.length);
    const bit = getBit(colors[loc], 0);
    testBits.push(bit);
  }
  console.log('前 32 位:', testBits.join(''));
  
  // 读取字节长度（16位）
  const byteLength = getNumberFromBits(colors, history, 16);
  
  // 验证长度
  const maxBytes = Math.floor(colors.length * 3 / 4 / 8);
  if (byteLength <= 0 || byteLength > maxBytes) {
    throw new Error(`未找到有效消息或消息已损坏 (byteLength: ${byteLength}, maxBytes: ${maxBytes})`);
  }
  
  console.log('解码字节长度:', byteLength);
  
  // 读取消息字节
  const bytes = Buffer.alloc(byteLength);
  for (let i = 0; i < byteLength; i++) {
    bytes[i] = getNumberFromBits(colors, history, 8);
  }
  
  console.log('前 20 个解码字节:', Array.from(bytes.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
  
  // 转换为字符串（UTF-8）
  const message = bytes.toString('utf8');
  console.log('解码后消息长度:', message.length);
  
  return message;
}

/**
 * 从图片文件中解码隐写信息
 * @param {string} filepath - 图片文件路径（PNG/JPG/BMP）
 * @returns {Promise<object>} - 解码后的数据对象
 */
async function decodeImageFile(filepath) {
  try {
    console.log('🔍 解码图片:', filepath);
    
    // 读取图片，确保转换为 RGBA 格式
    const image = sharp(filepath);
    const metadata = await image.metadata();
    
    console.log(`图片格式: ${metadata.format}, 尺寸: ${metadata.width}x${metadata.height}`);
    
    // 转换为原始 RGBA 像素数据（无损读取）
    const { data, info } = await image
      .ensureAlpha() // 确保有 Alpha 通道
      .raw() // 获取原始像素数据
      .toBuffer({ resolveWithObject: true });

    console.log(`处理后尺寸: ${info.width}x${info.height}, 通道数: ${info.channels}`);
    console.log('前 100 个字节:', Array.from(data.slice(0, 100)).map(b => b.toString(16).padStart(2, '0')).join(' '));

    // LSB 解码
    const jsonString = decodeMessage(data);
    
    console.log('解码后 JSON 字符串长度:', jsonString.length);
    console.log('解码内容:', jsonString);
    
    // 解析 JSON
    const errorData = JSON.parse(jsonString);
    
    return errorData;
  } catch (error) {
    console.error('解码错误详情:', error);
    throw new Error(`解码失败: ${error.message}`);
  }
}

module.exports = {
  decodeImageFile,
  decodeMessage
};
