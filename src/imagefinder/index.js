// ===== 图片重复查找功能测试 =====
import path from 'path';
import { fileURLToPath } from 'url'; // 新增导入
import { dirname } from 'path';
import fs from 'fs/promises';
import ImageDuplicateFinder from './imageDuplicateFinder.js';

// 添加ES模块兼容的路径处理
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const IMAGE_DIR = path.join(__dirname, 'image');

async function storeImagesToDatabase() {
  // 确保图片目录存在
  try {
    await fs.access(IMAGE_DIR);
  } catch (err) {
    console.error(`错误: 图片目录不存在 - ${IMAGE_DIR}`);
    console.log('请创建image目录并放入图片文件');
    return;
  }

  const finder = new ImageDuplicateFinder();

  // 初始化向量数据库
  await finder.initializeVectorStore();
  console.log('向量数据库初始化完成');

  // 获取image目录下的所有图片文件
  console.log('读取image目录下的图片文件...');
  const files = await fs.readdir(IMAGE_DIR);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
  const imageFiles = files.filter(file =>
    imageExtensions.includes(path.extname(file).toLowerCase())
  );

  const initialImages = imageFiles.map(file => path.join(IMAGE_DIR, file));

  console.log(`找到 ${initialImages.length} 张图片`);

  // 添加所有图片到数据库
  console.log('添加图片到数据库...');
  for (const imagePath of initialImages) {
    const imageName = path.basename(imagePath);
    await finder.storeImageVector(imagePath, imageName);
    console.log(`已添加: ${imageName}`);
  }

  // 保存数据库状态
  await finder.saveDatabase('faiss_index');
  console.log('向量数据库已保存');
}

async function retrieveSimilarImagesFromDatabase(testImagePath) {
  console.log(testImagePath);
  const finder = new ImageDuplicateFinder();
  await finder.loadDatabase('faiss_index');

  console.log(`查找与 ${path.basename(testImagePath)} 相似的图片...`);

  const similarImages = await finder.findSimilarImages(testImagePath);
  console.log(similarImages, 222);
  if (similarImages.length > 0) {
    console.log('找到相似图片:');
    similarImages.forEach((result, index) => {
      console.log(
        `${index + 1}. ${path.basename(
          result.path
        )} (相似度: ${result.similarity.toFixed(4)})`
      );
    });
  } else {
    console.log('未找到相似图片');
  }
}

// 执行测试
// storeImagesToDatabase().catch(console.error);
retrieveSimilarImagesFromDatabase(path.join(__dirname, 'test.png')).catch(
  console.error
);
