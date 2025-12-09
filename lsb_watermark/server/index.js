const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { decodeImageFile } = require('./decoder');

const app = express();
const PORT = 3000;

// 确保 uploads 目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-error${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB 限制
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只接受图片文件'));
    }
  }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// API: 上传图片（接收 PNG 文件）
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '未接收到图片文件' });
    }

    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};

    console.log('\n📸 收到图片上传:');
    console.log('文件名:', req.file.filename);
    console.log('大小:', req.file.size, '字节');
    console.log('类型:', req.file.mimetype);
    console.log('元数据:', metadata);

    res.json({
      success: true,
      filename: req.file.filename,
      size: req.file.size,
      uploadTime: Date.now()
    });
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API: 获取图片列表
app.get('/api/images', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const images = files
      .filter((file) => /\.(png|jpg|jpeg|bmp)$/i.test(file))
      .map((file) => {
        const filepath = path.join(uploadsDir, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          size: stats.size,
          uploadTime: stats.mtime.getTime()
        };
      })
      .sort((a, b) => b.uploadTime - a.uploadTime);

    res.json({ success: true, images });
  } catch (error) {
    console.error('获取图片列表失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API: 解码图片
app.get('/api/decode/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }

    console.log('\n🔍 解码图片:', filename);

    // 使用 sharp 读取并解码图片
    const data = await decodeImageFile(filepath);

    console.log('✅ 解码成功:');
    console.log(JSON.stringify(data, null, 2));

    res.json({ success: true, data });
  } catch (error) {
    console.error('解码失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now()
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 LSB 错误监控服务已启动');
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📂 上传目录: ${uploadsDir}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
