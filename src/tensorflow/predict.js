import * as tf from '@tensorflow/tfjs-node';
import { FILE_PATH } from './common.js';

// 定义与训练时相同的字符集和编码函数
const chars = ['a', 'b', 'c'];
const charToIndex = { a: 0, b: 1, c: 2 };

function charToOneHot(char) {
  const arr = new Array(chars.length).fill(0);
  const idx = charToIndex[char];
  if (idx === undefined) throw new Error(`未知字符: ${char}`);
  arr[idx] = 1;
  return arr;
}

async function loadAndPredict() {
  try {
    // 加载已保存的模型
    const model = await tf.loadLayersModel(`${FILE_PATH}/model.json`);
    console.log('模型加载成功！');

    // 准备输入数据（示例：预测字母a的下一个字母）
    const inputData = [[charToOneHot('a')]];
    const input = tf.tensor3d(inputData, [1, 1, chars.length]);

    // 进行预测
    const prediction = model.predict(input);
    prediction.print(); // 打印预测结果

    // 可选：将预测结果转换为可读格式
    const results = await prediction.array();
    const predictedChar = chars[results[0].indexOf(Math.max(...results[0]))];
    console.log(`预测下一个字母是: ${predictedChar}`);
  } catch (err) {
    console.error('加载或预测时出错:', err);
  }
}

loadAndPredict();
