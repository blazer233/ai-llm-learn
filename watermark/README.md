# RGB 隐水印工具

一个基于 Node.js 的图片隐写术工具，使用 LSB（最低有效位）算法在图片的 RGB 通道中嵌入和提取隐藏文本水印。

## 特性

- ✨ **隐蔽性强** - 使用 LSB 算法，肉眼几乎无法察觉
- 🎨 **多通道支持** - 可选择 R/G/B 任意通道
- 📏 **可调深度** - 支持 1-2 位 LSB，平衡容量与隐蔽性
- 🔍 **差异可视化** - 生成差异图查看水印位置
- 🌐 **中文支持** - 完整支持 UTF-8 编码

## 安装

```bash
# 克隆或下载项目后，安装依赖
npm install

# （可选）全局安装，可在任意位置使用 watermark 命令
npm install -g .
```

## 快速开始

### 方式一：使用 npm scripts（推荐）

```bash
# 嵌入水印
npm run embed input.png output.png "Hello World"

# 使用蓝色通道
npm run embed input.png output.png "秘密信息" -- --channel=b

# 使用 2 位 LSB
npm run embed input.png output.png "长文本" -- --bits=2

# 提取水印
npm run extract output.png

# 从指定通道提取
npm run extract output.png -- --channel=b --bits=2

# 生成差异图
npm run diff input.png output.png diff.png
```

### 方式二：直接使用 node 命令

### 嵌入水印

```bash
# 基本用法
node index.js embed input.png output.png "Hello World"

# 使用蓝色通道
node index.js embed input.png output.png "秘密信息" --channel=b

# 使用 2 位 LSB（容量更大但隐蔽性稍弱）
node index.js embed input.png output.png "长文本内容" --bits=2
```

### 提取水印

```bash
# 基本用法
node index.js extract output.png

# 从指定通道提取
node index.js extract output.png --channel=b --bits=2
```

### 生成差异图

```bash
# 可视化原图和水印图的差异
node index.js diff input.png output.png diff.png
```

### 方式三：全局命令（需先全局安装）

如果已执行 `npm install -g .`，可直接使用：

```bash
watermark embed input.png output.png "Hello World"
watermark extract output.png
watermark diff input.png output.png diff.png
```

## API 使用

```javascript
const { embedWatermark, extractWatermark, generateDiffImage } = require('./index');

// 嵌入水印
await embedWatermark('input.png', 'output.png', '水印内容', {
  channel: 'r',  // 'r' | 'g' | 'b'
  bits: 1,       // 1 | 2
});

// 提取水印
const watermark = await extractWatermark('output.png', {
  channel: 'r',
  bits: 1,
});

// 生成差异图
await generateDiffImage('input.png', 'output.png', 'diff.png');
```

## 参数说明

### 通道选项 (`--channel`)

- `r` - 红色通道（默认）
- `g` - 绿色通道
- `b` - 蓝色通道

**建议**：绿色通道通常最不易被察觉

### 位数选项 (`--bits`)

- `1` - 每像素使用 1 位 LSB（默认，最隐蔽）
- `2` - 每像素使用 2 位 LSB（容量翻倍，轻微可见）

## 技术原理

### LSB 算法

LSB（Least Significant Bit）即最低有效位算法，是一种常见的图片隐写术：

1. 将水印文本转换为二进制
2. 将二进制位替换像素值的最低位
3. 由于最低位变化极小（0-1），肉眼难以察觉

**示例**：
```
原始像素值: 11010110 (214)
水印位:     1
新像素值:   11010111 (215)  ← 仅改变最低位
```

### 水印格式

```
[32位长度头][水印内容]
```

- 前 32 位存储水印长度
- 后续位存储实际水印内容（UTF-8 编码）

### 容量计算

```
最大容量（字节） = (图片宽度 × 图片高度 × LSB位数) / 8 - 4
```

**示例**：
- 1920×1080 图片，1位LSB：约 259KB
- 1920×1080 图片，2位LSB：约 518KB

## 注意事项

### ⚠️ 重要限制

1. **必须使用无损格式**
   - ✅ PNG（推荐）
   - ❌ JPEG（有损压缩会破坏水印）
   - ❌ WebP 有损模式

2. **提取参数必须匹配**
   - 嵌入时使用的通道和位数，提取时必须相同
   - 否则会提取到错误或损坏的数据

3. **水印容量限制**
   - 水印长度不能超过图片容量
   - 工具会自动检查并报错

### 💡 最佳实践

- 使用 PNG 格式保存带水印图片
- 记录使用的通道和位数参数
- 对于重要水印，建议使用 1 位 LSB 确保隐蔽性
- 可通过差异图验证水印是否成功嵌入

## 示例场景

### 1. 版权保护

```bash
# 在摄影作品中嵌入版权信息
node index.js embed photo.png watermarked.png "© 2024 作者名. 保留所有权利."
```

### 2. 数据隐藏

```bash
# 隐藏敏感信息
node index.js embed cover.png secret.png "机密文档ID: ABC123456" --channel=g
```

### 3. 溯源追踪

```bash
# 嵌入唯一标识符
node index.js embed original.png distributed.png "用户ID: user_12345_20241202"
```

## 性能

- **嵌入速度**：约 1-2 秒/MB（取决于图片尺寸）
- **提取速度**：约 0.5-1 秒/MB
- **内存占用**：约 图片大小 × 3

## 常见问题

### Q: 水印会被压缩破坏吗？

A: 如果使用有损压缩（如 JPEG），水印会被破坏。必须使用无损格式（PNG）。

### Q: 提取出乱码怎么办？

A: 检查提取时使用的 `--channel` 和 `--bits` 参数是否与嵌入时一致。

### Q: 如何验证水印是否成功？

A: 使用 `diff` 命令生成差异图，如果看到规律性的点状分布，说明嵌入成功。

### Q: 水印会影响图片质量吗？

A: 1位LSB 几乎无影响，2位LSB 可能在纯色区域有轻微噪点（需放大才能看到）。

## 许可证

ISC
