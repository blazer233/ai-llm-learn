# 从前端视角探索语言模型基础

在当前大型语言模型（LLM）如deepsek、gpt4系列风靡全球的背景下，作为前端开发也可以借助TensorFlow.js探索语言模型的基础技术。

最近在研究如何使用 TensorFlow.js 训练一个小模型 这样也能参与到语言模型这场浪潮之中

这篇文章从0实现一个**字母序列预测模型** 它可以学习字母之间的规律，预测给定字母后最可能出现的下一个字符。虽然与拥有数百亿参数的LLM相比，该模型规模仅有几千参数，但它完整涵盖了从数据预处理到模型训练的流程，但和真实项目也有很大的区别：

- 规模极小（仅处理字母表而非真实语料）
- 未使用词嵌入(Embedding)等现代技术
- 没有分词等复杂预处理

这篇文章对于前端开发来说只是提供了一个轻量级的入门示范，展示了如何利用js实现基础的文本生成和序列预测功能，这里使用了传统的lstm网络架构，后面也会探究在Transformer架构中的实现与差异，当然本人对于模型的训练能力有限，我尽量把每个步骤梳理清晰，有不对的地方欢迎大家指出


## 一、准备工作：字符集与数据编码
### 1. 字符集定义

首先，我们需要定义一个字符集（chars），它包含所有可能出现的字符。例如：

```javascript
const chars = ['a', 'b', 'c', ..., 'z'];
```
这个字符集是模型的“词汇表”，模型的输入和输出都基于这个集合。这个也是我们要预测的内容

### 2. 字符到索引的映射
为了方便处理，我们将字符映射为索引：
```javascript
const charToIndex = {};
chars.forEach((char, index) => {
  charToIndex[char] = index;
});
```
这样，字符 'a' 可能对应索引 0，'b' 对应 1，依此类推。
### 3. One-hot 编码
神经网络无法直接处理字符，需要将字符转换为数值向量。最简单的方式是 one-hot 编码，即用一个长度等于字符集大小的向量表示字符，只有对应字符索引位置为 1，其余为 0 

即把每个字母转换为一个稀疏向量

例如，字符 'b' 在长度为 26 的字符集中的 one-hot 编码是：
```javascript
[0, 1, 0, 0, ..., 0]
```
我们可以定义一个 charToOneHot 函数来实现 one-hot 编码：

```javascript
export function charToOneHot(charToIndex, char) {
  const arr = new Array(chars.length).fill(0);
  const idx = charToIndex[char];
  if (idx === undefined) throw new Error(`未知字符: ${char}`);
  arr[idx] = 1;
  return arr;
}
```

## 二、构建训练数据
训练数据由输入和输出组成：

- 输入（xs）：当前字符的 one-hot 编码。
- 输出（ys）：下一个字符的 one-hot 编码。

例如，给定字符串 "abc"，训练对为：

- 输入：'a'，输出：'b'
- 输入：'b'，输出：'c'
代码实现：

```javascript
const xsData = [];
const ysData = [];

for (let i = 0; i < chars.length - 1; i++) {
  xsData.push([charToOneHot(charToIndex, chars[i])]); // 注意这里是二维数组
  ysData.push(charToOneHot(charToIndex, chars[i + 1]));
}
```

这里 xsData 是一个三维数组，形状为 [样本数, 1, 字符集长度]，符合 LSTM 输入要求。

可以看一下处理之后的 
xsData ：

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/a59b5fbaeb75425eacff28c49dba477b~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgYmxhemVy:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzkxMzkxNzEyNjY4MjU1OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1748502497&x-orig-sign=JApya3VbjFaeyOlYYrEW4Quq8CU%3D)
 
ysData ：

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/200029c1e0d34842880a98752bd232ad~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgYmxhemVy:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzkxMzkxNzEyNjY4MjU1OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1748502569&x-orig-sign=WJ9rUqN1rEZz%2BPO7xt8S%2FhAqLC0%3D)


## 三、模型构建
基于 **LSTM** 的序列模型，适合处理时间序列数据。

那什么是 LSTM 模型呢 ？

LSTM（Long Short-Term Memory，长短期记忆网络）是一种特殊的循环神经网络（RNN），专门用来处理和预测序列数据，比如文本、语音、时间序列等。

普通的循环神经网络在处理长序列时，容易出现“梯度消失”或“梯度爆炸”的问题，导致模型难以记住序列中较早的信息。LSTM 通过设计了“门控机制”（输入门、遗忘门、输出门），能够有选择地记住或遗忘信息，从而更好地捕捉长距离依赖关系。

简单来说，LSTM 就像一个带有记忆功能的“智能循环网络”，它能记住重要的信息，忘掉无关的内容，适合处理语言、时间序列等需要上下文理解的任务。

- 这里额外引入一个例子来阐述一下 **LSTM** 模型：

在写童书时，这本童书里只有三种句子：「道格看见珍（句号）」、「珍看见小点（句号）」、以及「小点看见道格（句号）」。

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/54dde3617ecb42a9a2369b9bd93d40f4~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgYmxhemVy:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzkxMzkxNzEyNjY4MjU1OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1748507440&x-orig-sign=dNIDyKu5eZSMYCrzZYB%2F8m3eclo%3D)

这本童书的字汇量很小，只有「道格」、「珍」、「小点」、「看见」以及句号。在这个例子里，神经网络的功能用在于将这些单字按正确的顺序排好，根据规律我们发现在「珍、道格、小点」之后，模型预测「看见」和句点的机率应该会大幅提升，因为这两个单字都会跟着特定名字出现，且不会单独出现

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/c2d2aca969844b5cbf40d295f7432722~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgYmxhemVy:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzkxMzkxNzEyNjY4MjU1OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1748508056&x-orig-sign=HM4mXT2n11ZOj7xbRogJFjm2EaA%3D)

并且如果我们前一次预测了名字，那这些预测也会加强接下来预测「看见」或句号的机率；如果我们看到「看见」或句号，也能想像模型接下来会倾向于预测「珍、道格、小点」等名字

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/2c79585503254f9c97af472b3ec58d26~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgYmxhemVy:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzkxMzkxNzEyNjY4MjU1OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1748508034&x-orig-sign=Vff9oTMeV%2FiDE02MJCEC5yNBFvg%3D)
我们可以将这个流程和架构视为一个 RNN 模型


![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/5a717b6d4c954fdbb6b2afba38a1cf02~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgYmxhemVy:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzkxMzkxNzEyNjY4MjU1OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1748508160&x-orig-sign=3fweZppaFTBjHp8mGTUAr2VfBBY%3D)

除了模型本身，通过挤压函数进行表达，即：如果有个选项每次都得到两次投票，它的数值也会被乘以二，随着流程重复，这个数字很容易被放大成天文数字。借由确保数值介于 1 和 -1 之间，即使我们将数值相乘无数次，也不用担心它会在循环中无限增大，通过不断的训练从而预测出结果，上述是对LSTM的简述，下面我们继续搭建我们的字母序列预测模型

### 模型结构

-   **输入层**：形状为 `[序列长度, 词汇表大小]`，这里序列长度为 1。
-   **LSTM 层**：提取序列特征，单元数为 32（嵌入维度）。
-   **全连接层（Dense）** ：输出大小等于词汇表大小，使用 softmax 激活函数，输出每个字符的概率。

`tf.input()` 是定义模型输入层的形状和数据类型
- `shape`: 指定输入张量的形状（不含batch维度）
- 本例中 `[1, chars.length]` 表示：
- 每个输入样本包含1个时间步
- 每个时间步是长度为chars.length的one-hot向量

| 层级   | 类型  | 输出形状             | 说明         |
| ------ | ----- | -------------------- | ------------ |
| 输入层 | Input | [null, 1, vocabSize] | 数据入口     |
| LSTM层 | LSTM  | [null, 32]           | 序列特征提取 |
| 输出层 | Dense | [null, vocabSize]    | 字符概率预测 |


```javascript
// 参数说明：
// - vocabSize: 词汇表大小（字符集长度）
// - seqLength: 序列长度（默认为1）
// - embedDim: 嵌入维度（默认为32）
function buildLstmModel(vocabSize, seqLength = 1, embedDim = 32) {
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
```


## 四、构建训练数据
### 1. 编译模型

选择优化器和损失函数：

-   优化器：Adam，学习率 0.01，适合大多数任务。（默认选就行了）
-   损失函数：`categoricalCrossentropy`，适合多分类问题。（这么填就完事了）
-   监控指标：准确率。

```
model.compile({
  optimizer: tf.train.adam(0.01),
  loss: 'categoricalCrossentropy',
  metrics: ['accuracy'],
});
```

### 2. 训练模型

训练时，输入数据形状需匹配模型输入：
确保输入张量严格符合LSTM层要求的`[batchSize, timeSteps, features]`格式

```
const reshapedXs = tf.reshape(xs, [xs.shape[0], 1, chars.length]);
```

调用 `model.fit` 进行训练：

```
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
```

训练过程中，每 10 个 epoch 输出一次损失，方便观察训练进展。

## 五、保存模型并且验证
### 1. 保存模型

训练完成后，将模型保存到指定路径，方便后续加载和推理：

```
await model.save(FILE_PATH);
console.log(`模型已保存到: ${FILE_PATH}`);
```


![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/daa64b4dcc54439cb436298b5dd3ffc0~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgYmxhemVy:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzkxMzkxNzEyNjY4MjU1OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1748511017&x-orig-sign=JinDd7yHAj%2FB2abvfHbG6fELrBU%3D)

### 2. 加载模型

```
const model = await tf.loadLayersModel(`${FILE_PATH}/model.json`);
console.log('模型加载成功！');
```

-   `tf.loadLayersModel` 用于加载基于 Keras 或 TensorFlow SavedModel 格式保存的模型。
-   模型文件通常包含 `model.json` 和权重文件。
-   加载成功后，模型即可用于推理。

* * *

### 3. 准备输入数据

```
const charMap = chars.reduce((acc, char, index) => {
  acc[char] = index;
  return acc;
}, {});

const inputData = [[charToOneHot(charMap, word)]];
const input = tf.tensor3d(inputData, [1, 1, chars.length]);
```

-   **字符映射**：将字符映射到对应的索引，方便进行OneHot。
-   **onehot编码**：`charToOneHot` 函数将输入字符转换成长度等于字符集大小的数组，只有对应字符位置为1，其余为0。
-   **构造张量**：模型期望输入形状为 `[batch_size, time_steps, input_dim]`，这里是 `[1, 1, chars.length]`，表示一次输入一个字符，序列长度为1。

### 4. 执行预测

```
const prediction = model.predict(input);
prediction.print();
```

-   `model.predict` 接收输入张量，输出预测结果。
-   预测结果是一个概率分布，表示每个字符作为下一个字符的可能性。
-   `prediction.print()` 在控制台打印预测张量，方便调试。

### 5. 解析预测结果

```
const results = await prediction.array();
const predictedChar = chars[results[0].indexOf(Math.max(...results[0]))];
console.log(`预测 ${word} 下一个字母是: ${predictedChar}`, results);
```

-   `prediction.array()` 将张量转换为 JavaScript 数组。
-   `results[0]` 是预测的概率数组。
-   使用 `Math.max` 找到最大概率值，`indexOf` 找到对应索引。
-   根据索引从 `chars` 中取出对应字符，即预测的下一个字符。

至此，可以正确预测26个英文字母中，每个字母的下一个字符

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/cd229ef9e7fb46dc896829a5355cd1c8~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgYmxhemVy:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzkxMzkxNzEyNjY4MjU1OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1748502152&x-orig-sign=ytKu8S0I97YDGyYH6wUQwZPXNiQ%3D)‘

## 六、完整代码结构
公共文件：
```javascript
export const FILE_PATH = 'file://./output/model';
export const chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
export function charToOneHot(charToIndex, char) {
  const arr = new Array(chars.length).fill(0);
  const idx = charToIndex[char];
  if (idx === undefined) throw new Error(`未知字符: ${char}`);
  arr[idx] = 1;
  return arr;
}

```

模型训练：
```javascript
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
```
模型加载：
```
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

```
## 七、参考文章

-   [TensorFlow.js 官方文档](https://js.tensorflow.org/)
-   [LSTM 详解与应用](https://colah.github.io/posts/2015-08-Understanding-LSTMs/)
-   [递归神经网络（RNN）和长短期记忆模型（LSTM）的运作原理](https://brohrer.mcknote.com/zh-Hans/how_machine_learning_works/how_rnns_lstm_work.html)



