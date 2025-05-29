import * as tf from '@tensorflow/tfjs-node';
import { chars, FILE_PATH, charToOneHot } from './common.js';

// 创建字符到索引的映射字典
// 例如：{'a':0, 'b':1, ...}
const charToIndex = {};
// 遍历字符集创建映射关系
chars.forEach((char, index) => {
  charToIndex[char] = index;
});

// 初始化训练数据容器
const xsData = []; // 输入数据（当前字符）
const ysData = []; // 输出数据（下一个字符）

// 生成训练数据对：当前字符 -> 下一个字符
for (let i = 0; i < chars.length - 1; i++) {
  // 将当前字符转为one-hot编码并存入输入集
  xsData.push([charToOneHot(charToIndex, chars[i])]);
  // 将下一个字符转为one-hot编码并存入输出集
  ysData.push(charToOneHot(charToIndex, chars[i + 1]));
}
console.log(ysData);
// 将JavaScript数组转换为TensorFlow张量
// 输入张量：3D形状 [样本数, 1, 字符集长度]
const xs = tf.tensor3d(xsData, [xsData.length, 1, chars.length]);
// 输出张量：2D形状 [样本数, 字符集长度]
const ys = tf.tensor2d(ysData, [ysData.length, chars.length]);

// 定义Transformer模型构建函数
// 参数说明：
// - vocabSize: 词汇表大小（字符集长度）
// - seqLength: 序列长度（默认为1）
// - embedDim: 嵌入维度（默认为32）
function buildTransformerModel(vocabSize, seqLength = 1, embedDim = 32) {
  // 定义模型输入层，指定输入形状
  const input = tf.input({ shape: [seqLength, vocabSize] });

  // 添加LSTM层作为简化版的序列处理
  const lstmLayer = tf.layers
    .lstm({
      units: embedDim, // LSTM单元数
      inputShape: [seqLength, vocabSize], // 输入形状
    })
    .apply(input); // 将输入连接到该层

  // 添加全连接输出层
  const output = tf.layers
    .dense({
      units: vocabSize, // 输出单元数等于字符集大小
      activation: 'softmax', // 使用softmax激活函数
    })
    .apply(lstmLayer); // 将LSTM层输出连接到该层

  // 创建并返回模型实例
  return tf.model({
    inputs: input, // 指定模型输入
    outputs: output, // 指定模型输出
  });
}

// 定义模型训练函数
async function train() {
  console.log('开始训练字母预测模型...');

  // 调整输入张量形状以匹配模型输入要求
  const reshapedXs = tf.reshape(xs, [xs.shape[0], 1, chars.length]);

  // 执行模型训练
  await model.fit(reshapedXs, ys, {
    epochs: 100, // 训练轮数
    batchSize: 4, // 批处理大小
    callbacks: {
      // 训练回调函数
      onEpochEnd: (epoch, logs) => {
        // 每10轮打印一次损失值
        if (epoch % 10 === 0) {
          console.log(`Epoch ${epoch}: 损失=${logs.loss.toFixed(4)}`);
        }
      },
    },
  });

  // 训练完成后保存模型
  await model.save(FILE_PATH);
  console.log(`模型已保存到: ${FILE_PATH}`);
}

// 创建模型实例，传入字符集长度作为词汇表大小
const model = buildTransformerModel(chars.length);

// 编译模型，配置训练参数
model.compile({
  optimizer: tf.train.adam(0.01), // 使用Adam优化器，学习率0.01
  loss: 'categoricalCrossentropy', // 使用分类交叉熵损失函数
  metrics: ['accuracy'], // 监控准确率指标
});

// 启动训练过程，捕获并打印可能的错误
train().catch(err => console.error('训练出错:', err));
