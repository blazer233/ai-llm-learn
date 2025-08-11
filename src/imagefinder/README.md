# AI 图像相似度检索系统技术文档

## 1. 项目概述

本项目是一个基于人工智能的图像相似度检索系统。它使用先进的深度学习模型（CLIP）将图像内容转换为高维特征向量（Embeddings），并利用高性能的 Faiss 向量数据库对这些向量进行存储和高效检索。

该系统可以快速地从一个大型图片库中，找出一张或多张与给定查询图片在视觉内容上最相似的图片。

## 2. 核心技术栈

- **运行时**: Node.js
- **AI 模型**: `Xenova/clip-vit-base-patch16` (通过 `@xenova/transformers.js` 加载)
- **向量数据库**: Facebook AI's Faiss (通过 `faiss-node` 和 `@langchain/community` 的 `FaissStore` 封装)
- **核心依赖**:
  - `@xenova/transformers`: 用于加载和运行 AI 模型，提取图像特征。
  - `@langchain/community`: 提供了 `FaissStore`，一个方便的 Faiss 数据库接口。
  - `@langchain/core`: LangChain 的核心功能库。
  - `faiss-node`: Faiss 在 Node.js 环境下的原生绑定。

## 3. 实现原理

系统的工作流程分为两个核心阶段：**索引构建**和**相似性检索**。

### 第一阶段：索引构建 (Embedding Generation & Storage)

1.  **读取图片**: 脚本首先会遍历指定的 `image/` 目录，获取所有需要处理的图片文件。
2.  **特征提取**: 每一张图片都会被送入预加载的 CLIP 模型。该模型会分析图片的视觉内容，并输出一个高维的数学表示——**特征向量（Embedding）**。这个向量可以被看作是图片的“数字指纹”。
3.  **存入数据库**: 生成的特征向量连同其对应的图片路径等元数据，被批量存入 Faiss 向量数据库。Faiss 会为这些向量建立一个高效的索引结构，以便于未来的快速检索。
4.  **持久化**: 建立好的 Faiss 索引被保存到磁盘的 `faiss_db/` 目录中，以便重复使用，无需每次都重新生成。

### 第二阶段：相似性检索 (Similarity Search)

1.  **加载数据库**: 当需要进行查询时，脚本会从磁盘加载已经构建好的 Faiss 数据库索引。
2.  **处理查询图片**: 用户指定的查询图片会经过与第一阶段相同的处理，即通过 CLIP 模型生成其自身的特征向量。
3.  **执行检索**: 脚本将查询图片的特征向量提交给 Faiss 数据库，并调用其内置的 `similaritySearchVectorWithScore` 方法。Faiss 会利用其高效的索引，在海量数据中快速计算并找出与查询向量最“接近”的N个向量。
4.  **返回结果**: 系统返回与查询图片最相似的图片列表，并附带一个相似度分数，分数越高代表内容越相似。

## 4. 项目设置与运行

### 4.1. 环境准备

- 确保你的系统已经安装了 [Node.js](https://nodejs.org/) (建议 v18 或更高版本)。

### 4.2. 安装依赖

在项目根目录下，打开终端并执行以下命令来安装所有必需的依赖包：

```bash
npm install @xenova/transformers @langchain/community @langchain/core faiss-node
```

### 4.3. 准备图片

1.  将你想要建立索引的所有图片放入 `src/imagefinder/image/` 目录下。
2.  将你想要用来查询的测试图片（例如 `test.png`）放在 `src/imagefinder/` 目录下。

### 4.4. 执行脚本

通过以下命令来运行主脚本：

```bash
node src/imagefinder/imageSimilarity.js
```

脚本会自动执行以下两个步骤：
1.  **构建索引**: 为 `image/` 目录下的所有图片生成特征向量并存入 Faiss 数据库。
2.  **执行查询**: 使用 `test.png` 作为查询图片，在数据库中找出最相似的3张图片并打印结果。

## 5. 代码结构解析 (`imageSimilarity.js`)

- **`TransformerEmbeddings` 类**:
  这是一个自定义的嵌入类，它继承了 LangChain 的 `Embeddings` 基类。其主要作用是作为一个“桥梁”，将 `@xenova/transformers` 模型的特征提取能力与 LangChain 的 `FaissStore` 组件连接起来。

- **`generateAndStoreEmbeddings(embeddings)` 函数**:
  负责索引构建。它遍历图片目录，调用 `FaissStore.fromTexts` 方法，批量地为图片生成向量并构建数据库，最后将数据库文件保存到磁盘。

- **`findSimilarImages(embeddings, queryImagePath, topK)` 函数**:
  负责相似性检索。它首先从磁盘加载 Faiss 数据库，然后为查询图片生成向量，最后调用 `vectorStore.similaritySearchVectorWithScore` 执行高效的检索并返回结果。

- **`run()` 函数**:
  这是脚本的主入口函数。它负责：
  1. 初始化 AI 模型和自定义的 `TransformerEmbeddings` 类。
  2. 调用 `generateAndStoreEmbeddings` 来构建索引。
  3. 调用 `findSimilarImages` 来执行一次示例查询。

## 6. 自定义与扩展

- **更改查询图片**: 在 `run()` 函数中，修改 `testImagePath` 变量的值为你自己的查询图片路径。
- **调整返回数量**: 在 `run()` 函数调用 `findSimilarImages` 时，修改第三个参数 `topK` 的值（例如 `findSimilarImages(embeddings, testImagePath, 10)`）。
- **更换模型**: 在文件顶部的 `MODEL` 常量中，你可以尝试替换为其他兼容的 `Xenova` CLIP 模型。
