#!/usr/bin/env node
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * RGB隐水印工具
 * 使用LSB（最低有效位）算法在图片中嵌入和提取水印
 */

/**
 * 将文本转换为二进制字符串
 */
function textToBinary(text) {
  const buffer = Buffer.from(text, 'utf-8');
  let binary = '';
  for (const byte of buffer) {
    binary += byte.toString(2).padStart(8, '0');
  }
  return binary;
}

/**
 * 将二进制字符串转换为文本
 */
function binaryToText(binary) {
  const bytes = [];
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8);
    if (byte.length === 8) {
      bytes.push(parseInt(byte, 2));
    }
  }
  return Buffer.from(bytes).toString('utf-8');
}

/**
 * 嵌入水印到图片
 * @param {string} inputPath - 输入图片路径
 * @param {string} outputPath - 输出图片路径
 * @param {string} watermark - 水印文本
 * @param {object} options - 选项
 */
async function embedWatermark(inputPath, outputPath, watermark, options = {}) {
  const { channel = 'r', bits = 1 } = options;
  
  // 读取图片
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const { width, height, channels } = metadata;
  
  // 获取原始像素数据
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // 准备水印数据
  // 格式: [32位长度][水印内容]
  const watermarkBinary = textToBinary(watermark);
  const lengthBinary = watermarkBinary.length.toString(2).padStart(32, '0');
  const fullBinary = lengthBinary + watermarkBinary;
  
  // 检查容量
  const maxCapacity = Math.floor((width * height * bits) / 8);
  if (fullBinary.length > width * height * bits) {
    throw new Error(`水印太长！最大容量: ${maxCapacity} 字节，需要: ${Math.ceil(fullBinary.length / 8)} 字节`);
  }
  
  // 选择通道索引
  const channelMap = { r: 0, g: 1, b: 2 };
  const channelIndex = channelMap[channel.toLowerCase()] || 0;
  
  // 嵌入水印
  const pixelData = Buffer.from(data);
  const pixelChannels = info.channels;
  
  let bitIndex = 0;
  for (let i = 0; i < pixelData.length && bitIndex < fullBinary.length; i += pixelChannels) {
    const pixelOffset = i + channelIndex;
    
    // 对每个像素嵌入 bits 位
    for (let b = 0; b < bits && bitIndex < fullBinary.length; b++) {
      const bit = parseInt(fullBinary[bitIndex], 10);
      const mask = ~(1 << b);
      pixelData[pixelOffset] = (pixelData[pixelOffset] & mask) | (bit << b);
      bitIndex++;
    }
  }
  
  // 保存图片
  await sharp(pixelData, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
    .png({ compressionLevel: 0 }) // 无损压缩
    .toFile(outputPath);
  
  console.log(`✅ 水印已嵌入: ${outputPath}`);
  console.log(`   图片尺寸: ${width}x${height}`);
  console.log(`   水印长度: ${watermark.length} 字符`);
  console.log(`   使用通道: ${channel.toUpperCase()}`);
  console.log(`   使用位数: ${bits} LSB`);
  
  return { width, height, watermarkLength: watermark.length };
}

/**
 * 从图片中提取水印
 * @param {string} inputPath - 输入图片路径
 * @param {object} options - 选项
 */
async function extractWatermark(inputPath, options = {}) {
  const { channel = 'r', bits = 1 } = options;
  
  // 读取图片
  const image = sharp(inputPath);
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // 选择通道索引
  const channelMap = { r: 0, g: 1, b: 2 };
  const channelIndex = channelMap[channel.toLowerCase()] || 0;
  
  const pixelChannels = info.channels;
  
  // 首先提取长度（32位）
  let lengthBinary = '';
  let pixelIndex = 0;
  
  for (let i = 0; i < data.length && lengthBinary.length < 32; i += pixelChannels) {
    const pixelOffset = i + channelIndex;
    
    for (let b = 0; b < bits && lengthBinary.length < 32; b++) {
      const bit = (data[pixelOffset] >> b) & 1;
      lengthBinary += bit;
    }
    pixelIndex++;
  }
  
  const watermarkLength = parseInt(lengthBinary, 2);
  
  // 验证长度合理性
  if (watermarkLength <= 0 || watermarkLength > data.length) {
    throw new Error('未找到有效水印或水印已损坏');
  }
  
  // 提取水印内容
  let watermarkBinary = '';
  let bitCount = 0;
  const startPixel = Math.ceil(32 / bits);
  
  for (let i = startPixel * pixelChannels; i < data.length && bitCount < watermarkLength; i += pixelChannels) {
    const pixelOffset = i + channelIndex;
    
    for (let b = 0; b < bits && bitCount < watermarkLength; b++) {
      const bit = (data[pixelOffset] >> b) & 1;
      watermarkBinary += bit;
      bitCount++;
    }
  }
  
  // 转换为文本
  const watermark = binaryToText(watermarkBinary);
  
  console.log(`✅ 水印已提取`);
  console.log(`   水印内容: ${watermark}`);
  console.log(`   使用通道: ${channel.toUpperCase()}`);
  console.log(`   使用位数: ${bits} LSB`);
  
  return watermark;
}

/**
 * 生成水印差异图（用于可视化隐藏的水印）
 * @param {string} originalPath - 原始图片路径
 * @param {string} watermarkedPath - 带水印图片路径
 * @param {string} outputPath - 输出差异图路径
 */
async function generateDiffImage(originalPath, watermarkedPath, outputPath) {
  const original = await sharp(originalPath).raw().toBuffer({ resolveWithObject: true });
  const watermarked = await sharp(watermarkedPath).raw().toBuffer({ resolveWithObject: true });
  
  if (original.info.width !== watermarked.info.width || 
      original.info.height !== watermarked.info.height) {
    throw new Error('图片尺寸不匹配');
  }
  
  const diffData = Buffer.alloc(original.data.length);
  
  // 计算差异并放大以便可视化
  for (let i = 0; i < original.data.length; i++) {
    const diff = Math.abs(original.data[i] - watermarked.data[i]);
    diffData[i] = Math.min(255, diff * 64); // 放大差异
  }
  
  await sharp(diffData, {
    raw: {
      width: original.info.width,
      height: original.info.height,
      channels: original.info.channels,
    },
  })
    .png()
    .toFile(outputPath);
  
  console.log(`✅ 差异图已生成: ${outputPath}`);
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log(`
RGB隐水印工具

用法:
  node index.js embed <输入图片> <输出图片> <水印文本> [选项]
  node index.js extract <图片路径> [选项]
  node index.js diff <原图> <水印图> <输出差异图>

选项:
  --channel=r|g|b    使用的颜色通道 (默认: r)
  --bits=1|2         每像素使用的LSB位数 (默认: 1)

示例:
  node index.js embed input.png output.png "Hello World"
  node index.js embed input.png output.png "秘密信息" --channel=b --bits=2
  node index.js extract output.png
  node index.js diff input.png output.png diff.png
`);
    return;
  }
  
  // 解析选项
  const options = {};
  const positionalArgs = [];
  
  for (const arg of args.slice(1)) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (key === 'bits') {
        options[key] = parseInt(value, 10);
      } else {
        options[key] = value;
      }
    } else {
      positionalArgs.push(arg);
    }
  }
  
  try {
    switch (command) {
      case 'embed': {
        const [input, output, watermark] = positionalArgs;
        if (!input || !output || !watermark) {
          console.error('错误: 缺少参数。用法: embed <输入图片> <输出图片> <水印文本>');
          process.exit(1);
        }
        await embedWatermark(input, output, watermark, options);
        break;
      }
      
      case 'extract': {
        const [input] = positionalArgs;
        if (!input) {
          console.error('错误: 缺少参数。用法: extract <图片路径>');
          process.exit(1);
        }
        await extractWatermark(input, options);
        break;
      }
      
      case 'diff': {
        const [original, watermarked, output] = positionalArgs;
        if (!original || !watermarked || !output) {
          console.error('错误: 缺少参数。用法: diff <原图> <水印图> <输出差异图>');
          process.exit(1);
        }
        await generateDiffImage(original, watermarked, output);
        break;
      }
      
      default:
        console.error(`未知命令: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`错误: ${error.message}`);
    process.exit(1);
  }
}

// 导出函数供外部使用
module.exports = {
  embedWatermark,
  extractWatermark,
  generateDiffImage,
};

// 如果直接运行则执行命令行接口
if (require.main === module) {
  main();
}
