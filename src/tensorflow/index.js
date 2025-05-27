import * as tf from '@tensorflow/tfjs-node';
import { chars, FILE_PATH } from './common.js';

// 创建字母到索引的映射
const charToIndex = {};
chars.forEach((char, index) => {
  charToIndex[char] = index;
});

// 构造训练数据（one-hot 编码）
function charToOneHot(char) {
  const arr = new Array(chars.length).fill(0);
  const idx = charToIndex[char];
  if (idx === undefined) throw new Error(`Unknown char: ${char}`);
  arr[idx] = 1;
  return arr;
}

// 生成训练数据：每个字母预测下一个字母
const xsData = [];
const ysData = [];
for (let i = 0; i < chars.length - 1; i++) {
  xsData.push([charToOneHot(chars[i])]); // 当前字母
  ysData.push(charToOneHot(chars[i + 1])); // 下一个字母
}

// 转换为Tensor
const xs = tf.tensor3d(xsData, [xsData.length, 1, chars.length]);
const ys = tf.tensor2d(ysData, [ysData.length, chars.length]);

// 定义更强大的LSTM模型
const model = tf.sequential();
model.add(
  tf.layers.lstm({
    units: 128, // 增加LSTM单元数量
    inputShape: [1, chars.length],
    returnSequences: false, // 只输出最后一步的结果
  })
);
model.add(
  tf.layers.dense({
    units: chars.length,
    activation: 'softmax',
  })
);

// 编译模型
model.compile({
  optimizer: tf.train.adam(0.01), // 调整学习率
  loss: 'categoricalCrossentropy',
  metrics: ['accuracy'],
});

// 训练模型
async function train() {
  console.log('开始训练字母预测模型...');

  // 增加训练轮次
  await model.fit(xs, ys, {
    epochs: 500,
    batchSize: 8,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 50 === 0) {
          console.log(
            `Epoch ${epoch}: 损失=${logs.loss.toFixed(
              4
            )}, 准确率=${logs.acc.toFixed(4)}`
          );
        }
      },
    },
  });

  // 保存模型
  await model.save(FILE_PATH);
  console.log(`模型已保存到: ${FILE_PATH}`);

  // 测试预测功能
  await predictSequence('a', 10); // 从a开始预测10个字母
}

// 预测连续字母序列
async function predictSequence(startChar, length) {
  let currentChar = startChar;
  let sequence = [currentChar];

  for (let i = 0; i < length; i++) {
    const input = tf.tensor3d(
      [[charToOneHot(currentChar)]],
      [1, 1, chars.length]
    );
    const prediction = await model.predict(input).data();

    // 获取概率最高的字母
    const predictedIndex = prediction.indexOf(Math.max(...prediction));
    currentChar = chars[predictedIndex];
    sequence.push(currentChar);

    input.dispose(); // 释放内存
  }

  console.log(`预测序列: ${sequence.join(' → ')}`);
  return sequence;
}

// 启动训练
train().catch(err => console.error('训练出错:', err));
