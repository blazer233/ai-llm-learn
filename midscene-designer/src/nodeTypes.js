// MidsceneJS 核心节点类型定义
// 优化后的配色方案：统一柔和色调，避免过于鲜亮
export const MIDSCENE_NODE_TYPES = {
  // 基础操作 - 使用柔和的蓝绿色
  navigate: {
    name: '导航',
    description: '导航到指定URL',
    category: 'basic',
    config: { url: 'https://baidu.com' },
    color: '#5B8C99', // 柔和的青蓝色
  },

  // AI 核心功能 - 使用统一的深蓝灰色系
  aiAction: {
    name: 'AI动作',
    description: 'AI智能执行动作',
    category: 'ai',
    config: { target: '输入框' },
    color: '#6B7FA8', // 柔和的蓝灰色
  },
  aiTap: {
    name: 'AI点击',
    description: 'AI智能点击元素',
    category: 'ai',
    config: { target: '按钮' },
    color: '#6B7FA8', // 柔和的蓝灰色（统一）
  },
  aiInput: {
    name: 'AI输入',
    description: 'AI智能输入文本',
    category: 'ai',
    config: { target: '输入框', value: '测试文本' },
    color: '#6B7FA8', // 柔和的蓝灰色（统一）
  },
  aiBoolean: {
    name: 'AI判断',
    description: 'AI验证页面状态（支持分支）',
    category: 'ai',
    config: { instruction: '检查页面是否加载完成' },
    color: '#7A8BAD', // 稍浅的蓝灰色（略微区分）
  },
  waitForTimeout: {
    name: '等待',
    description: '等待条件',
    category: 'ai',
    config: { value: '' },
    color: '#6B7FA8', // 柔和的蓝灰色（统一）
  },

  // 基本工具 - 使用柔和的青色
  screenshot: {
    name: '截图',
    description: '截取整张页面截图',
    category: 'tool',
    config: {},
    color: '#5B9AA8', // 柔和的青色
  },

  // 流程控制 - 使用低饱和度的暖色
  end: {
    name: '结束',
    description: '结束测试并关闭浏览器',
    category: 'control',
    config: {},
    color: '#A87C7C', // 柔和的玫瑰灰色
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
    basic: '基础操作',
    ai: 'AI功能',
    tool: '工具',
    control: '流程控制',
  };
  return displayNames[category] || category.toUpperCase();
};
