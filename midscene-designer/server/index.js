// MidsceneJS 核心执行服务器
import express from 'express';
import cors from 'cors';
import { PlaywrightAgent } from '@midscene/web';
import playwright from 'playwright';
import dotenv from 'dotenv';
import { nodeExecutors, buildExecutionFlow, getNextNode } from './node.js';

dotenv.config();

// 设置环境变量禁用网络发现
process.env.PLAYWRIGHT_BROWSERS_PATH = '0';
process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1';
const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

let browser, context, page, agent;

// 执行API
app.post('/api/execute', async (req, res) => {
  try {
    const { nodes, edges } = req.body;
    // 初始化浏览器
    if (!browser) {
      browser = await playwright.chromium.launch({
        headless: false,
        // 禁用网络发现功能，避免 macOS 弹出权限请求
        args: [
          '--disable-features=VizDisplayCompositor',
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--disable-client-side-phishing-detection',
          '--disable-sync',
          '--metrics-recording-only',
          '--no-first-run',
          '--safebrowsing-disable-auto-update',
          '--disable-component-update',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-back-forward-cache',
          '--disable-backgrounding-occluded-windows',
          '--disable-features=TranslateUI,BlinkGenPropertyTrees',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--mute-audio',
          '--no-default-browser-check',
          '--no-first-run',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-sandbox',
        ],
      });
      context = await browser.newContext({
        // 禁用地理位置权限
        permissions: [],
        // 禁用通知权限
        ignoreHTTPSErrors: true,
      });
      page = await context.newPage();

      // 设置默认超时时间为60秒，避免页面加载超时
      page.setDefaultTimeout(60000);
      page.setDefaultNavigationTimeout(60000);

      // 禁用页面的自动等待加载状态
      page.context().setExtraHTTPHeaders({});

      agent = new PlaywrightAgent(page, {
        // 配置 Midscene 的超时时间
        timeout: 60000,
      });
      console.log('✅ 浏览器和AI代理已初始化');
    }

    const results = [];
    const totalStartTime = Date.now();
    const { nodeMap, edgeMap } = buildExecutionFlow(nodes, edges);

    console.log(`🚀 开始执行流程`);

    // 找到起始节点（没有入边的节点）
    const incomingEdges = new Set(edges.map(e => e.target));
    const startNodes = nodes.filter(node => !incomingEdges.has(node.id));

    if (startNodes.length === 0) {
      throw new Error('未找到起始节点');
    }

    let currentNode = startNodes[0];
    let executionCount = 0;
    const maxExecutions = nodes.length * 2; // 防止无限循环
    // 按流程执行节点
    while (currentNode && executionCount < maxExecutions) {
      executionCount += 1;

      try {
        let result;
        const { data } = currentNode;
        // 执行对应的节点处理器
        const executor = nodeExecutors[data.type];
        if (executor) {
          // 创建执行上下文，传递必要的依赖
          const executionContext = {
            page,
            agent,
            browser,
            context,
            setBrowserState: () => {
              browser = null;
              context = null;
              page = null;
              agent = null;
            },
          };
          result = await executor(data, executionContext);
        } else {
          result = {
            success: false,
            message: `不支持的节点类型: ${data.type}`,
          };
        }

        results.push({ nodeId: currentNode.id, ...result });

        // 如果是结束节点，停止执行
        if (data.type === 'end') {
          console.log(`🏁 执行流程结束`);
          break;
        }

        // 获取下一个节点
        const nextNode = getNextNode(currentNode.id, result, edgeMap, nodeMap);
        currentNode = nextNode;
      } catch (error) {
        console.error(`❌ 执行失败: ${error.message}`);
        const errorResult = {
          nodeId: currentNode.id,
          success: false,
          message: `执行失败: ${error.message}`,
          branchType: 'failure',
        };
        results.push(errorResult);

        // 尝试获取失败分支的下一个节点
        const nextNode = getNextNode(
          currentNode.id,
          errorResult,
          edgeMap,
          nodeMap
        );
        currentNode = nextNode;
        if (!nextNode) break;
      }
    }

    if (executionCount >= maxExecutions) {
      console.log(`⚠️ 达到最大执行次数限制`);
    }

    const totalTime = Date.now() - totalStartTime;
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(
      `🏁 流程执行完成！成功: ${successCount}, 失败: ${failureCount}, 耗时: ${totalTime}ms`
    );

    // 构建节点结果映射，包含截图数据
    const nodeResults = results.map(result => ({
      nodeId: result.nodeId,
      success: result.success,
      message: result.message,
      screenshotData: result.screenshotData || null,
      executionTime: result.executionTime,
    }));

    res.json({
      success: true,
      results,
      nodeResults, // 前端用于更新节点状态和截图
      statistics: {
        totalNodes: nodes.length,
        successCount,
        failureCount,
        totalExecutionTime: totalTime,
        averageExecutionTime: Math.round(totalTime / nodes.length),
      },
    });
  } catch (error) {
    console.error('执行错误:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 MidsceneJS执行服务器启动: http://localhost:${PORT}`);
});
