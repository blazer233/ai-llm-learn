import React from 'react';

const ScreenshotPreview = ({ screenshotData, onClose }) => {
  const downloadScreenshot = () => {
    const link = document.createElement('a');
    link.href = screenshotData;
    link.download = `screenshot-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.png`;
    link.click();
  };

  const openInNewWindow = () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>截图预览 - ${new Date().toLocaleString()}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                padding: 20px;
              }
              .container {
                background: white;
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 90vw;
                max-height: 90vh;
                overflow: auto;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
                color: #374151;
              }
              .header h1 {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 8px;
              }
              .header p {
                font-size: 14px;
                color: #6b7280;
              }
              img { 
                max-width: 100%; 
                height: auto;
                border-radius: 12px;
                box-shadow: 0 8px 16px rgba(0,0,0,0.1);
                display: block;
                margin: 0 auto;
              }
              .error {
                text-align: center;
                color: #ef4444;
                font-size: 16px;
                padding: 40px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📸 页面截图</h1>
                <p>生成时间: ${new Date().toLocaleString()}</p>
              </div>
              ${screenshotData ? 
                `<img src="${screenshotData}" alt="页面截图" />` : 
                '<div class="error">❌ 截图数据不可用</div>'
              }
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      alert('无法打开新窗口，请检查浏览器弹窗设置');
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      zIndex: 1000,
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: 16,
      boxShadow: '0 10px 25px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
      maxWidth: '320px',
      minWidth: '280px'
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid #f3f4f6'
      }}>
        <span style={{ 
          fontSize: '14px', 
          fontWeight: '600',
          color: '#374151'
        }}>
          📸 截图预览
        </span>
        <button
          onClick={onClose}
          style={{
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#e5e7eb';
            e.target.style.color = '#374151';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#f3f4f6';
            e.target.style.color = '#6b7280';
          }}
        >
          ✕
        </button>
      </div>
      
      {/* 截图图片 */}
      <div style={{
        marginBottom: 12,
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #f3f4f6'
      }}>
        <img
          src={screenshotData}
          alt="页面截图"
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '200px',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </div>
      
      {/* 操作按钮 */}
      <div style={{
        display: 'flex',
        gap: 8,
        justifyContent: 'center'
      }}>
        <button
          onClick={downloadScreenshot}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
          }}
        >
          📥 下载
        </button>
        <button
          onClick={openInNewWindow}
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
          }}
        >
          🔍 查看大图
        </button>
      </div>
    </div>
  );
};

export default ScreenshotPreview;