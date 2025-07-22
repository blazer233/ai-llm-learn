import * as tf from '@tensorflow/tfjs-node';

// --- 1. 简单字符级分词 ---
const text = 'hello world! this is a simple transformer example.';
const chars = Array.from(new Set(text));
const vocabSize = chars.length;

const char2idx = {};
const idx2char = {};
chars.forEach((c, i) => {
  char2idx[c] = i;
  idx2char[i] = c;
});

const textAsIndices = Array.from(text).map(c => char2idx[c]);

// --- 2. 构造训练样本 ---
const seqLen = 10;
const examples = [];
for (let i = 0; i < textAsIndices.length - seqLen; i++) {
  const inputSeq = textAsIndices.slice(i, i + seqLen);
  const targetSeq = textAsIndices.slice(i + 1, i + seqLen + 1);
  examples.push({ inputSeq, targetSeq });
}

const xs = tf.tensor2d(
  examples.map(e => e.inputSeq),
  [examples.length, seqLen],
  'int32'
);
const ys = tf.tensor2d(
  examples.map(e => e.targetSeq),
  [examples.length, seqLen],
  'int32'
);

// --- 3. 自定义位置编码层 ---
class PositionalEncoding extends tf.layers.Layer {
  constructor(config) {
    super(config);
    this.seqLen = config.seqLen;
    this.dModel = config.dModel;
    this.posEncoding = this.getPositionalEncoding(this.seqLen, this.dModel);
  }

  getPositionalEncoding(seqLen, dModel) {
    const posEnc = [];
    for (let pos = 0; pos < seqLen; pos++) {
      const row = [];
      for (let i = 0; i < dModel; i++) {
        const angle = pos / Math.pow(10000, (2 * Math.floor(i / 2)) / dModel);
        if (i % 2 === 0) {
          row.push(Math.sin(angle));
        } else {
          row.push(Math.cos(angle));
        }
      }
      posEnc.push(row);
    }
    // 返回 shape [1, seqLen, dModel] 的常量张量
    return tf.tensor(posEnc).expandDims(0);
  }

  call(inputs) {
    // inputs shape: [batch, seqLen, dModel]
    // posEncoding shape: [1, seqLen, dModel]
    return tf.tidy(() => inputs.add(this.posEncoding));
  }

  computeOutputShape(inputShape) {
    return inputShape;
  }

  static get className() {
    return 'PositionalEncoding';
  }
}
tf.serialization.registerClass(PositionalEncoding);

// --- 4. Transformer Encoder Layer ---
class TransformerEncoderLayer extends tf.layers.Layer {
  constructor(config) {
    super(config);
    this.dModel = config.dModel;
    this.numHeads = config.numHeads;
    this.dff = config.dff;
    this.dropoutRate = config.dropoutRate || 0.1;

    // 自定义多头注意力实现
    this.mha = {
      apply: (inputs, { training }) => {
        return tf.tidy(() => {
          const [query, key, value] = inputs;
          const dk = tf.sqrt(tf.scalar(this.dModel / this.numHeads));

          // 简化的注意力计算
          const scores = tf.matMul(query, key.transpose([0, 2, 1])).div(dk);
          const attention = tf.softmax(scores, -1);
          if (training && this.dropoutRate > 0) {
            attention.dropout(this.dropoutRate);
          }
          return tf.matMul(attention, value);
        });
      },
    };

    this.ffn = tf.sequential();
    this.ffn.add(tf.layers.dense({ 
      units: this.dff, 
      activation: 'relu',
      inputShape: [this.dModel]  // 明确指定输入形状
    }));
    this.ffn.add(tf.layers.dense({ units: this.dModel }));

    this.layernorm1 = tf.layers.layerNormalization({ epsilon: 1e-6 });
    this.layernorm2 = tf.layers.layerNormalization({ epsilon: 1e-6 });

    this.dropout1 = tf.layers.dropout({ rate: this.dropoutRate });
    this.dropout2 = tf.layers.dropout({ rate: this.dropoutRate });
  }

  call(inputs, training) {
    return tf.tidy(() => {
      // inputs shape: [batch, seqLen, dModel]
      const attnOutput = this.mha.apply([inputs, inputs, inputs], { training });
      const attnOutputDrop = this.dropout1.apply(attnOutput, { training });
      const out1 = this.layernorm1.apply(tf.add(inputs, attnOutputDrop));

      const ffnOutput = this.ffn.apply(out1);
      const ffnOutputDrop = this.dropout2.apply(ffnOutput, { training });
      const out2 = this.layernorm2.apply(tf.add(out1, ffnOutputDrop));

      return out2;
    });
  }

  computeOutputShape(inputShape) {
    return inputShape;
  }

  static get className() {
    return 'TransformerEncoderLayer';
  }
}
tf.serialization.registerClass(TransformerEncoderLayer);

// --- 5. 构建模型 ---
function buildModel(vocabSize, seqLen, dModel = 64, numHeads = 4, dff = 256) {
  const inputs = tf.input({ shape: [seqLen], dtype: 'int32' });

  const embeddingLayer = tf.layers.embedding({
    inputDim: vocabSize,
    outputDim: dModel,
  });
  let x = embeddingLayer.apply(inputs); // [batch, seqLen, dModel]

  const posEncodingLayer = new PositionalEncoding({ seqLen, dModel });
  x = posEncodingLayer.apply(x);

  const encoderLayer = new TransformerEncoderLayer({ dModel, numHeads, dff });
  x = encoderLayer.apply(x);

  // 输出层，预测每个位置的下一个 token
  const logits = tf.layers.dense({ units: vocabSize }).apply(x);

  return tf.model({ inputs, outputs: logits });
}

// --- 6. 训练 ---
async function train() {
  const model = buildModel(vocabSize, seqLen);

  model.compile({
    optimizer: tf.train.adam(),
    loss: tf.losses.sparseCategoricalCrossentropy,
    metrics: ['accuracy'],
  });

  await model.fit(xs, ys, {
    epochs: 50,
    batchSize: 16,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(
          `Epoch ${epoch + 1}: loss=${logs.loss.toFixed(
            4
          )} acc=${logs.acc.toFixed(4)}`
        );
      },
    },
  });

  await model.save('file://./transformer-model');
}

train().catch(console.error);
