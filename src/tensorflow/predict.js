import * as tf from '@tensorflow/tfjs-node';
import { FILE_PATH, chars, charToOneHot } from './common.js';

async function loadAndPredict(word) {
  try {
    // 加载已保存的模型
    const model = await tf.loadLayersModel(`${FILE_PATH}/model.json`);
    console.log('模型加载成功！');

    // 准备输入数据（示例：预测字母a的下一个字母）
    const charMap = chars.reduce((acc, char, index) => {
      acc[char] = index;
      return acc;
    }, {});

    const inputData = [[charToOneHot(charMap, word)]];
    const input = tf.tensor3d(inputData, [1, 1, chars.length]);

    // 进行预测
    const prediction = model.predict(input);
    prediction.print(); // 打印预测结果

    // 可选：将预测结果转换为可读格式
    const results = await prediction.array();
    const predictedChar = chars[results[0].indexOf(Math.max(...results[0]))];
    console.log(`预测 ${word} 下一个字母是: ${predictedChar}`, results);
  } catch (err) {
    console.error('加载或预测时出错:', err);
  }
}

loadAndPredict('a');
