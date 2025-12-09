#!/usr/bin/env node

/**
 * LSB 图片解析命令行工具
 * 使用方法: node decode-cli.js <图片路径>
 */

const { decodeImageFile } = require('./decoder');
const path = require('path');
const fs = require('fs');

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('\n使用方法: node decode-cli.js <图片路径>');
    console.log('\n示例:');
    console.log('  node decode-cli.js uploads/error-1234567890.png');
    console.log('  node decode-cli.js ./my-image.png');
    process.exit(1);
  }

  const imagePath = args[0];
  const fullPath = path.isAbsolute(imagePath)
    ? imagePath
    : path.join(process.cwd(), imagePath);

  // 检查文件是否存在
  if (!fs.existsSync(fullPath)) {
    console.error(`\n❌ 错误: 文件不存在 - ${fullPath}`);
    process.exit(1);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 LSB 图片解析工具');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`📁 文件路径: ${fullPath}`);

  try {
    console.log('🔄 正在解析图片...\n');

    const data = await decodeImageFile(fullPath);

    console.log('✅ 解析成功！\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 提取的错误信息:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 如果有错误信息，单独显示
    if (data.message) {
      console.log('📝 错误消息:', data.message);
    }
    if (data.timestamp) {
      console.log('🕐 发生时间:', new Date(data.timestamp).toLocaleString());
    }
    if (data.url) {
      console.log('🔗 页面地址:', data.url);
    }

    console.log('\n✨ 解析完成！\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 解析失败:', error.message);
    console.error('\n可能的原因:');
    console.error('  1. 图片中没有隐写信息');
    console.error('  2. 图片格式不支持');
    console.error('  3. 隐写信息已损坏');
    console.error('\n');
    process.exit(1);
  }
}

main();
