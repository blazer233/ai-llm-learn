// MidsceneJS 核心执行服务
class MidsceneExecutionService {
  constructor() {
    this.apiEndpoint = 'http://localhost:3002/api/execute';
  }

  async executeFlow(nodes, edges) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) {
        throw new Error(`执行失败: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('MidsceneJS执行错误:', error);
      throw new Error('无法连接到MidsceneJS执行服务。请确保后端服务正在运行。');
    }
  }
}

export default MidsceneExecutionService;
