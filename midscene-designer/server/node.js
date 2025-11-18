/**
 * 节点执行器映射 - 将每个节点类型映射到对应的执行函数
 * 每个执行器函数接收两个参数：
 * @param {Object} data - 节点配置数据
 * @param {Object} context - 执行上下文，包含 page, agent, browser 等
 * @returns {Object} 执行结果对象
 */
export const nodeExecutors = {
  /**
   * 导航节点 - 导航到指定URL
   */
  navigate: async (data, { page }) => {
    console.log(`[导航] 导航到: ${data.config.url}`);
    const startTime = Date.now();
    await page.goto(data.config.url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
    const executionTime = Date.now() - startTime;
    return {
      success: true,
      message: `导航到 ${data.config.url}`,
      executionTime,
    };
  },

  /**
   * AI点击节点 - 使用AI智能识别并点击目标元素
   */
  aiTap: async (data, { agent }) => {
    console.log(`[AI点击] AI点击: "${data.config.target}"`);
    const startTime = Date.now();
    const aiResult = await agent.aiTap(data.config.target);
    const executionTime = Date.now() - startTime;
    return {
      success: true,
      message: `AI点击: ${data.config.target}`,
      executionTime,
      aiResult,
    };
  },

  /**
   * AI动作节点 - 执行AI动作
   */
  aiAction: async (data, { agent }) => {
    console.log(`[AI动作] AI Action: "${data.config.target}"`);
    const startTime = Date.now();
    const aiResult = await agent.aiAction(data.config.target);
    const executionTime = Date.now() - startTime;
    return {
      success: true,
      message: `AI aiAction: ${data.config.target}`,
      executionTime,
      aiResult,
    };
  },

  /**
   * AI输入节点 - 使用AI智能识别输入框并输入内容
   */
  aiInput: async (data, { agent }) => {
    console.log(`[AI输入] AI输入: "${data.config.target}" = "${data.config.value}"`);
    const startTime = Date.now();
    const aiResult = await agent.aiInput(data.config.value, data.config.target);
    const executionTime = Date.now() - startTime;
    return {
      success: true,
      message: `AI输入: ${data.config.value}`,
      executionTime,
      aiResult,
    };
  },

  /**
   * AI验证节点 - 使用AI验证页面状态，支持是/否分支
   */
  aiBoolean: async (data, { agent }) => {
    console.log(`[AI验证] AI验证: "${data.config.instruction}"`);
    const startTime = Date.now();
    const assertResult = await agent.aiBoolean(data.config.instruction);
    const executionTime = Date.now() - startTime;
    return {
      success: true,
      message: `AI验证成功: ${data.config.instruction}：${assertResult ? '是' : '否'}`,
      executionTime,
      data: assertResult,
      branchType: assertResult ? 'success' : 'failure',
    };
  },

  /**
   * 结束节点 - 结束流程并关闭浏览器
   */
  end: async (data, { browser, context, page, setBrowserState }) => {
    console.log(`[结束] 流程结束`);
    if (browser) {
      // 如果配置了状态名称，保存状态
      if (data.config?.stateName && context && page) {
        try {
          console.log(`[保存] 状态已保存: ${data.config.stateName}`);
        } catch (error) {
          console.error('保存状态失败:', error);
        }
      }

      await browser.close();
      setBrowserState();
    }
    return {
      success: true,
      message: '测试结束，浏览器已关闭',
      executionTime: 0,
    };
  },

  /**
   * 截图节点 - 截取整张页面截图
   */
  screenshot: async (data, { page }) => {
    console.log(`[截图] 截取页面截图`);
    const startTime = Date.now();

    try {
      const screenshotBuffer = await page.screenshot({
        type: 'png',
        fullPage: true,
      });
      const screenshotBase64 = `data:image/png;base64,${screenshotBuffer.toString(
        'base64'
      )}`;
      const executionTime = Date.now() - startTime;

      console.log(`[截图] 截图完成，耗时: ${executionTime}ms`);

      return {
        success: true,
        message: '截图已生成',
        screenshotData: screenshotBase64,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`[失败] 截图失败: ${error.message}`);

      return {
        success: false,
        message: `截图失败: ${error.message}`,
        executionTime,
      };
    }
  },

  /**
   * 等待节点 - 等待指定时间或条件
   */
  waitForTimeout: async (data, { agent, page }) => {
    console.log(`[等待] 等待: ${data.config.value}`);
    const startTime = Date.now();
    if (isNaN(Number(data.config.value))) {
      // AI条件等待
      await agent.aiWaitFor(data.config.value);
    } else {
      // 时间等待
      await page.waitForTimeout(Number(data.config.value));
    }
    const executionTime = Date.now() - startTime;
    return {
      success: true,
      message: `等待 ${data.config.value}`,
      executionTime,
    };
  },
};

// 根据边连接关系构建节点执行流程
export function buildExecutionFlow(nodes, edges) {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const edgeMap = new Map();

  // 按源节点分组边
  edges.forEach(edge => {
    if (!edgeMap.has(edge.source)) {
      edgeMap.set(edge.source, []);
    }
    edgeMap.get(edge.source).push(edge);
  });

  return { nodeMap, edgeMap };
}

// 获取下一个要执行的节点
export function getNextNode(currentNodeId, currentResult, edgeMap, nodeMap) {
  const edges = edgeMap.get(currentNodeId) || [];

  for (const edge of edges) {
    // 检查边的条件
    if (edge.data?.condition) {
      const condition = edge.data.condition;
      if (condition === 'success' && currentResult.success) {
        return nodeMap.get(edge.target);
      }
      if (condition === 'failure' && !currentResult.success) {
        return nodeMap.get(edge.target);
      }
    } else {
      // 无条件边，直接连接
      return nodeMap.get(edge.target);
    }
  }

  return null;
}
