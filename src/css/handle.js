import { readFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { FILE_PATH } from './common.js';
import { SPLIT_SIGN } from '../config.js';

async function readJsonFile(filePath) {
  try {
    const absolutePath = path.join(
      path.dirname(new URL(import.meta.url).pathname),
      filePath
    );
    console.log(absolutePath);
    const data = await readFile(absolutePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取JSON文件失败:', error);
    throw error; // 或者返回null/默认值
  }
}

const start = async () => {
  const jsonData = await readJsonFile('./css.json');
  fs.writeFileSync(
    FILE_PATH,
    Object.keys(jsonData)
      .slice(2)
      .map(
        i =>
          `类名：${jsonData[i].body[0]} 描述：${
            jsonData[i].description
              ? Array.isArray(jsonData[i].description)
                ? jsonData[i].description.join('')
                : jsonData[i].description
              : `设置样式${i}`
          }`
      )
      .join(SPLIT_SIGN)
  );
};

start();
