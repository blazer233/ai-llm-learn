import * as tf from '@tensorflow/tfjs-node';
import { FILE_PATH } from './common.js';

// 假设字符集和训练数据
const chars = ['a', 'b', 'c'];
const charToIndex = { a: 0, b: 1, c: 2 };

// 构造训练数据（one-hot 编码）
function charToOneHot(char) {
  const arr = new Array(chars.length).fill(0);
  const idx = charToIndex[char];
  if (idx === undefined) throw new Error(`Unknown char: ${char}`);
  arr[idx] = 1;
  return arr;
}

// 明确构造三维数组
const xsData = [
  [[1, 0, 0]], // 'a' 的 one-hot 编码
  [[0, 1, 0]], // 'b' 的 one-hot 编码
];
const xs = tf.tensor3d(xsData, [2, 1, chars.length]);

const ys = tf.tensor2d(
  [charToOneHot('b'), charToOneHot('c')],
  [2, chars.length]
);

// 定义模型
const model = tf.sequential();
model.add(tf.layers.lstm({ units: 20, inputShape: [1, chars.length] }));
model.add(tf.layers.dense({ units: chars.length, activation: 'softmax' }));
model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });

// 训练模型
async function train() {
  await model.fit(xs, ys, { epochs: 100 });

  // 保存模型到本地文件
  await model.save(FILE_PATH);
  console.log(`模型已保存到: ${FILE_PATH}`);

  // 训练完成后预测
  const inputData = [[charToOneHot('a')]];
  const input = tf.tensor3d(inputData, [1, 1, chars.length]);
  const prediction = model.predict(input);
  prediction.print();
}

train();
