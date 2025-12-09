import { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { encodeMessage } from './utils/lsb';
import './App.css';

const API_URL = 'http://localhost:3000';

function App() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  const showStatus = (message, type = 'info') => {
    setStatus({ message, type });
    setTimeout(() => setStatus(''), 3000);
  };

  const triggerError = async () => {
    try {
      setLoading(true);
      
      // 构造错误信息
      const errorInfo = {
        type: 'runtime_error',
        message: '这是一个测试错误！',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      showStatus('正在截取页面...', 'info');

      // 使用 html2canvas 截图
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: 1
      });

      showStatus('正在隐写错误信息...', 'info');

      // 获取图像数据
      const ctx = canvas.getContext('2d');
      
      // 关闭图像平滑（关键！避免像素值被修改）
      ctx.imageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // 使用 LSB 隐写
      const errorJSON = JSON.stringify(errorInfo);
      console.log('原始 JSON:', errorJSON);
      const encodeResult = encodeMessage(imageData.data, errorJSON);
      console.log('编码结果:', encodeResult);

      showStatus('正在生成无损 PNG...', 'info');

      // 使用 putImageData 直接写回 Canvas（避免重绘导致的像素变化）
      ctx.putImageData(imageData, 0, 0);

      // 转换为 PNG Blob（PNG 本身是无损的）
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      console.log('PNG 大小:', blob.size, '字节');

      showStatus('正在上传到服务器...', 'info');

      // 使用 FormData 上传 PNG 文件
      const formData = new FormData();
      formData.append('image', blob, `error-${Date.now()}.png`);
      formData.append('metadata', JSON.stringify({
        timestamp: errorInfo.timestamp,
        type: errorInfo.type
      }));

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        showStatus('✅ 错误信息已上报！', 'success');
        // 刷新图片列表
        fetchUploadedImages();
      } else {
        showStatus(`❌ 上传失败: ${result.message || '未知错误'}`, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showStatus('❌ 处理失败: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUploadedImages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/images`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUploadedImages(data.images || []);
    } catch (error) {
      console.error('Failed to fetch images:', error);
      showStatus(`❌ 获取图片列表失败: ${error.message}`, 'error');
    }
  };

  const decodeImage = async (filename) => {
    try {
      showStatus('正在解析图片...', 'info');
      const response = await fetch(`${API_URL}/api/decode/${filename}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success) {
        alert(`解析成功！\n\n${JSON.stringify(data.data, null, 2)}`);
        showStatus('✅ 解析成功', 'success');
      } else {
        showStatus(`❌ 解析失败: ${data.message || '未知错误'}`, 'error');
      }
    } catch (error) {
      console.error('Decode error:', error);
      showStatus(`❌ 解析失败: ${error.message}`, 'error');
    }
  };

  // 组件加载时获取图片列表
  useEffect(() => {
    fetchUploadedImages();
  }, []);

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🔍 LSB 错误监控系统</h1>
          <p>React + Node.js 精简版</p>
        </header>

        {status && (
          <div className={`status-toast ${status.type}`}>
            {status.message}
          </div>
        )}

        <div className="card">
          <h2>📝 错误上报演示</h2>
          <p className="description">
            点击下方按钮触发错误，系统将自动截图并使用 LSB 算法将错误信息隐写到图片中，然后上传到服务器。
          </p>
          <button
            className="btn btn-primary"
            onClick={triggerError}
            disabled={loading}
          >
            {loading ? '处理中...' : '🚨 触发错误并上报'}
          </button>
        </div>

        <div className="card">
          <h2>📸 已上传的图片</h2>
          <div className="toolbar">
            <button className="btn btn-secondary" onClick={fetchUploadedImages}>
              🔄 刷新列表
            </button>
          </div>
          {uploadedImages.length === 0 ? (
            <p className="empty-state">暂无上传记录</p>
          ) : (
            <div className="image-list">
              {uploadedImages.map((img) => (
                <div key={img.filename} className="image-item">
                  <img
                    src={`${API_URL}/uploads/${img.filename}`}
                    alt={img.filename}
                    className="thumbnail"
                  />
                  <div className="image-info">
                    <p className="filename">{img.filename}</p>
                    <p className="filesize">{(img.size / 1024).toFixed(2)} KB</p>
                    <p className="timestamp">
                      {new Date(img.uploadTime).toLocaleString()}
                    </p>
                    <button
                      className="btn btn-small"
                      onClick={() => decodeImage(img.filename)}
                    >
                      🔓 解析错误信息
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2>📖 使用说明</h2>
          <ol className="instructions">
            <li>点击"触发错误并上报"按钮</li>
            <li>系统自动截取当前页面</li>
            <li>使用 LSB 算法将错误信息隐写到图片中</li>
            <li>上传图片到 Node.js 服务器</li>
            <li>点击"解析错误信息"可从图片中提取隐藏的错误数据</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default App;
