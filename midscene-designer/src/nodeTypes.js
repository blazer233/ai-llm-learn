// MidsceneJS 核心节点类型定义
export const MIDSCENE_NODE_TYPES = {
  // 基础操作
  navigate: {
    name: '🌐 导航',
    description: '导航到指定URL',
    category: 'basic',
    config: { url: 'https://baidu.com' },
    color: '#38a169',
  },

  // AI 核心功能
  aiAction: {
    name: '🤖 AI动作',
    description: 'AI智能执行动作',
    category: 'ai',
    config: { target: '输入框' },
    color: '#3182ce',
  },
  aiTap: {
    name: '👆 AI点击',
    description: 'AI智能点击元素',
    category: 'ai',
    config: { target: '按钮' },
    color: '#3182ce',
  },
  aiInput: {
    name: '⌨️ AI输入',
    description: 'AI智能输入文本',
    category: 'ai',
    config: { target: '输入框', value: '测试文本' },
    color: '#3182ce',
  },
  aiQuery: {
    name: '✅ AI验证',
    description: 'AI验证页面状态（支持分支）',
    category: 'ai',
    config: { instruction: '检查页面是否加载完成' },
    color: '#3182ce',
    supportsBranch: true,
  },
  aiWaitFor: {
    name: '⏰等待',
    description: '等待条件',
    category: 'ai',
    config: { value: '' },
    color: '#3182ce',
  },

  // 基本工具
  screenshot: {
    name: '📸 截图',
    description: '截取整张页面截图',
    category: 'tool',
    config: {},
    color: '#0987a0',
  },

  // 流程控制
  end: {
    name: '🏁 结束',
    description: '结束测试并关闭浏览器',
    category: 'control',
    config: {},
    color: '#e53e3e',
  },
};

// 按类别分组节点类型
export const getNodeTypesByCategory = () => {
  const categories = {};
  Object.entries(MIDSCENE_NODE_TYPES).forEach(([key, nodeType]) => {
    const category = nodeType.category || 'other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push({ key, ...nodeType });
  });
  return categories;
};

// 获取类别显示名称
export const getCategoryDisplayName = category => {
  const displayNames = {
    basic: '🌐 基础操作',
    ai: '🤖 AI功能',
    tool: '🛠️ 工具',
    control: '🎮 流程控制',
  };
  return displayNames[category] || category.toUpperCase();
};
