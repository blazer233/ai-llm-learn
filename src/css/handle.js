import fs from 'fs';
import { FILE_PATH } from './common.js';
import { SPLIT_SIGN } from '../config.js';
import { readJsonFile } from '../tool.js';

const start = async () => {
  const jsonData = await readJsonFile('./css.json', import.meta.url);
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
