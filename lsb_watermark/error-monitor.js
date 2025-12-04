/**
 * LSB 错误监控类
 * 基于 LSB 隐写技术实现的前端错误监控方案
 * 将错误信息隐写到截图中，一次上传完整的错误上下文
 */

class LSBErrorMonitor {
  constructor(config = {}) {
    this.config = {
      version: config.version || '1.0.0',
      apiUrl: config.apiUrl || '/api/error-report',
      maxBreadcrumbs: config.maxBreadcrumbs || 20,
      captureScreenshot: config.captureScreenshot !== false,
      autoReport: config.autoReport !== false,
      onError: config.onError || null,
      ...config
    };
    
    // 用户行为面包屑
    this.breadcrumbs = [];
    
    // 性能数据
    this.performanceData = {};
    
    // 初始化
    if (this.config.autoReport) {
      this.init();
    }
  }
  
  /**
   * 初始化监控
   */
  init() {
    // 监听错误事件
    window.addEventListener('error', this.handleError.bind(this));
    
    // 监听 Promise 拒绝
    window.addEventListener('unhandledrejection', this.handleRejection.bind(this));
    
    // 记录用户行为
    this.trackUserActions();
    
    // 收集性能数据
    this.collectPerformance();
    
    console.log('[LSB Monitor] 错误监控已启动');
  }
  
  /**
   * 追踪用户行为
   */
  trackUserActions() {
    // 点击事件
    document.addEventListener('click', (e) => {
      this.addBreadcrumb({
        type: 'click',
        target: this.getElementPath(e.target),
        text: e.target.textContent?.slice(0, 50) || '',
        time: Date.now()
      });
    });
    
    // 输入事件
    document.addEventListener('input', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        this.addBreadcrumb({
          type: 'input',
          target: this.getElementPath(e.target),
          value: e.target.value?.slice(0, 20) + '...',
          time: Date.now()
        });
      }
    });
    
    // 路由变化（History API）
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    const self = this;
    
    history.pushState = function(...args) {
      self.addBreadcrumb({
        type: 'navigation',
        from: window.location.pathname,
        to: args[2],
        time: Date.now()
      });
      return originalPushState.apply(this, args);
    };
    
    history.replaceState = function(...args) {
      self.addBreadcrumb({
        type: 'navigation',
        from: window.location.pathname,
        to: args[2],
        time: Date.now()
      });
      return originalReplaceState.apply(this, args);
    };
  }
  
  /**
   * 添加面包屑
   */
  addBreadcrumb(crumb) {
    this.breadcrumbs.push(crumb);
    
    // 只保留最近的N条
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }
  
  /**
   * 获取元素路径
   */
  getElementPath(element) {
    const path = [];
    let current = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      } else if (current.className) {
        const classes = Array.from(current.classList).slice(0, 2).join('.');
        if (classes) {
          selector += `.${classes}`;
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }
  
  /**
   * 收集性能数据
   */
  collectPerformance() {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      this.performanceData = {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstPaint: timing.responseEnd - timing.fetchStart,
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        request: timing.responseStart - timing.requestStart,
        response: timing.responseEnd - timing.responseStart
      };
    }
  }
  
  /**
   * 处理错误
   */
  async handleError(event) {
    const errorData = {
      type: 'error',
      version: this.config.version,
      route: window.location.href,
      error: {
        message: event.message,
        stack: event.error?.stack || '',
        line: event.lineno,
        col: event.colno,
        filename: event.filename
      },
      breadcrumbs: [...this.breadcrumbs],
      performance: this.performanceData,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    // 调用自定义错误处理
    if (this.config.onError) {
      this.config.onError(errorData);
    }
    
    // 上报
    await this.report(errorData);
  }
  
  /**
   * 处理 Promise 拒绝
   */
  async handleRejection(event) {
    const errorData = {
      type: 'unhandledRejection',
      version: this.config.version,
      route: window.location.href,
      error: {
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack || '',
        promise: String(event.promise)
      },
      breadcrumbs: [...this.breadcrumbs],
      performance: this.performanceData,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };
    
    await this.report(errorData);
  }
  
  /**
   * 上报错误
   */
  async report(errorData) {
    try {
      console.log('[LSB Monitor] 捕获错误:', errorData);
      
      if (!this.config.captureScreenshot) {
        // 不截图，直接上报JSON
        await this.upload({ type: 'json', data: errorData });
        return;
      }
      
      // 截图
      console.log('[LSB Monitor] 正在截图...');
      const screenshot = await this.captureScreen();
      
      // 隐写错误信息
      console.log('[LSB Monitor] 正在隐写错误信息...');
      const watermarkedImage = await this.embedErrorData(
        screenshot,
        JSON.stringify(errorData)
      );
      
      // 上传
      console.log('[LSB Monitor] 正在上传...');
      await this.upload({
        type: 'image',
        data: watermarkedImage,
        metadata: {
          version: this.config.version,
          timestamp: errorData.timestamp,
          errorType: errorData.type
        }
      });
      
      console.log('[LSB Monitor] 错误已上报');
    } catch (err) {
      console.error('[LSB Monitor] 上报失败:', err);
    }
  }
  
  /**
   * 截取屏幕
   */
  async captureScreen() {
    // 检查是否有 html2canvas
    if (typeof html2canvas === 'undefined') {
      throw new Error('需要引入 html2canvas 库');
    }
    
    const canvas = await html2canvas(document.body, {
      useCORS: true,
      allowTaint: true,
      logging: false
    });
    
    return canvas.toDataURL('image/png');
  }
  
  /**
   * 将错误数据隐写到图片中
   */
  async embedErrorData(imageDataURL, errorJSON) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // 获取像素数据
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // LSB 编码
          if (typeof encodeMessage !== 'function') {
            throw new Error('LSB 编码函数未加载');
          }
          
          const result = encodeMessage(imageData.data, errorJSON);
          console.log('[LSB Monitor] 隐写完成:', result);
          
          // 写回 canvas
          ctx.putImageData(imageData, 0, 0);
          
          // 转换为 DataURL
          resolve(canvas.toDataURL('image/png'));
        } catch (err) {
          reject(err);
        }
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = imageDataURL;
    });
  }
  
  /**
   * 上传数据
   */
  async upload(payload) {
    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`上传失败: ${response.status}`);
    }
    
    return response.json();
  }
  
  /**
   * 手动上报错误
   */
  async captureError(error, context = {}) {
    const errorData = {
      type: 'manual',
      version: this.config.version,
      route: window.location.href,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      breadcrumbs: [...this.breadcrumbs],
      performance: this.performanceData,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };
    
    await this.report(errorData);
  }
  
  /**
   * 销毁监控
   */
  destroy() {
    window.removeEventListener('error', this.handleError);
    window.removeEventListener('unhandledrejection', this.handleRejection);
    console.log('[LSB Monitor] 错误监控已停止');
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LSBErrorMonitor;
}
