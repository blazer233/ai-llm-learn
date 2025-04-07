import { Ollama } from '@langchain/ollama';
import fs from 'fs';
import path from 'path';

// 1. 初始化Ollama模型
const ollama = new Ollama({
  baseUrl: 'http://localhost:11434',
  model: 'llava:latest',
});

// 2. 获取images文件夹下所有图片
const imagesDir = path.join(process.cwd(), 'images');
const imageFiles = fs
  .readdirSync(imagesDir)
  .filter(file =>
    ['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase())
  );

// 3. 存储所有图片描述
let allDescriptions = '';

// 4. 依次处理每张图片
for (const imageFile of imageFiles) {
  try {
    const imagePath = path.join(imagesDir, imageFile);
    const base64Image = fs.readFileSync(imagePath).toString('base64');

    // 绑定当前图片并获取描述
    const res = await ollama
      .bind({ images: [base64Image] })
      .invoke('请用中文详细描述这张图片的内容');

    // 记录描述结果
    const description = `图片 ${imageFile} 的描述:\n${res}\n\n`;
    allDescriptions += description;
    console.log(description);
  } catch (err) {
    console.error(`处理图片 ${imageFile} 时出错:`, err);
  }
}

// 5. 输出最终结果
console.log('===== 所有图片描述汇总 =====');
console.log(allDescriptions);

// 6. 可选：将结果保存到同级目录下的文件
const outputPath = path.join(process.cwd(), 'image_descriptions.txt');
fs.writeFileSync(outputPath, allDescriptions);
console.log(`描述已保存到 ${outputPath}`);
