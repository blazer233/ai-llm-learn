/**
 * LSB 错误监控后端服务
 * 用于接收前端上报的含隐写信息的截图，并解析错误信息
 */

const express = require('express');
const sharp = require('sharp');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// LSB 解码函数（Node.js 版本）
function getBit(number, location) {
  return (number >> location) & 1;
}

function setBit(number, location, bit) {
  return (number & ~(1 << location)) | (bit << location);
}

function getNumberFromBits(colors, history) {
  let num = 0;
  for (let i = 0; i < 16; i++) {
    const loc = getNextLocation(history, colors.length);
    const bit = getBit(colors[loc], 0);
    num = setBit(num, i, bit);
  }
  return num;
}

function getNextLocation(history, total) {
  let next = history.length;
  
  // 跳过Alpha通道
  while ((next + 1) % 4 === 0) {
    next++;
  }
  
  history.push(next);
  return next;
}

function decodeMessage(colors) {
  const history = [];
  
  // 读取消息长度（16位）
  const messageSize = getNumberFromBits(colors, history);
  
  // 验证长度
  const maxSize = Math.floor(colors.length * 3 / 4 / 16);
  if (messageSize <= 0 || messageSize > maxSize) {
    throw new Error('未找到有效消息或消息已损坏');
  }
  
  // 读取消息内容
  const message = [];
  for (let i = 0; i < messageSize; i++) {
    const code = getNumberFromBits(colors, history);
    message.push(String.fromCharCode(code));
  }
  
  return message.join('');
}

// Base64 转 Buffer
function base64ToBuffer(base64) {
  const matches = base64.match(/^data:image\/\w+;base64,(.+)$/);
  if (!matches) {
    throw new Error('无效的 base64 格式');
  }
  return Buffer.from(matches[1], 'base64');
}

// 错误日志存储
const errorLogs = [];

// API: 接收错误报告
app.post('/api/error-report', async (req, res) => {
  try {
    const { type, data, metadata } = req.body;
    
    console.log(`\n📨 收到错误报告 [${type}]`);
    
    if (type === 'json') {
      // 直接 JSON 上报
      console.log('错误信息:', JSON.stringify(data, null, 2));
      errorLogs.push({
        id: errorLogs.length + 1,
        type: 'json',
        data,
        timestamp: Date.now()
      });
      
      res.json({ success: true, message: 'JSON 报告已接收' });
      return;
    }
    
    if (type === 'image') {
      // 图片隐写上报
      console.log('元数据:', metadata);
      
      // 解析图片
      const imageBuffer = base64ToBuffer(data);
      const image = sharp(imageBuffer);
      const { info, data: pixelData } = await image
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      console.log(`图片尺寸: ${info.width}x${info.height}, 通道数: ${info.channels}`);
      
      // LSB 解码
      const errorJSON = decodeMessage(pixelData);
      const errorData = JSON.parse(errorJSON);
      
      console.log('\n🔍 提取的错误信息:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('版本:', errorData.version);
      console.log('类型:', errorData.type);
      console.log('路由:', errorData.route);
      console.log('错误:', errorData.error.message);
      if (errorData.error.stack) {
        console.log('堆栈:\n', errorData.error.stack);
      }
      console.log('时间:', new Date(errorData.timestamp).toLocaleString());
      console.log('面包屑数:', errorData.breadcrumbs?.length || 0);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // 保存到日志
      errorLogs.push({
        id: errorLogs.length + 1,
        type: 'image',
        data: errorData,
        metadata,
        timestamp: Date.now()
      });
      
      // 可选：保存图片到磁盘
      const filename = `error-${Date.now()}.png`;
      const filepath = path.join(__dirname, 'screenshots', filename);
      
      // 确保目录存在
      if (!fs.existsSync(path.join(__dirname, 'screenshots'))) {
        fs.mkdirSync(path.join(__dirname, 'screenshots'));
      }
      
      fs.writeFileSync(filepath, imageBuffer);
      console.log(`💾 截图已保存: ${filepath}`);
      
      res.json({
        success: true,
        message: '图片报告已接收并解析',
        errorData: {
          version: errorData.version,
          type: errorData.type,
          message: errorData.error.message,
          timestamp: errorData.timestamp
        }
      });
      return;
    }
    
    res.status(400).json({ success: false, message: '不支持的报告类型' });
  } catch (error) {
    console.error('处理错误报告失败:', error);
    res.status(500).json({
      success: false,
      message: '处理失败: ' + error.message
    });
  }
});

// API: 获取错误日志列表
app.get('/api/error-logs', (req, res) => {
  res.json({
    total: errorLogs.length,
    logs: errorLogs.map(log => ({
      id: log.id,
      type: log.type,
      timestamp: log.timestamp,
      error: log.data?.error?.message || 'N/A',
      version: log.data?.version || log.metadata?.version || 'N/A'
    }))
  });
});

// API: 获取单个错误详情
app.get('/api/error-logs/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const log = errorLogs.find(l => l.id === id);
  
  if (!log) {
    res.status(404).json({ success: false, message: '日志不存在' });
    return;
  }
  
  res.json(log);
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    errorLogs: errorLogs.length
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 LSB 错误监控服务已启动');
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`📊 演示页面: http://localhost:${PORT}/demo.html`);
  console.log(`📡 API 端点: http://localhost:${PORT}/api/error-report`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

module.exports = app;
