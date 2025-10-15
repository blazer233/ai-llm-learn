// MidsceneJS 核心执行服务器
import express from 'express';
import cors from 'cors';
import { PlaywrightAgent } from '@midscene/web';
import playwright from 'playwright';
import dotenv from 'dotenv';
 
dotenv.config(); 
const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

let browser, context, page, agent;

// 根据边连接关系构建节点执行流程
function buildExecutionFlow(nodes, edges) {
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
function getNextNode(currentNodeId, currentResult, edgeMap, nodeMap) {
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

// 执行API
app.post('/api/execute', async (req, res) => {
  try {
    const { nodes, edges } = req.body;
    // 初始化浏览器
    if (!browser) {
      browser = await playwright.chromium.launch({ headless: false });
      context = await browser.newContext();
      page = await context.newPage();
      agent = new PlaywrightAgent(page);
      console.log('✅ 浏览器和AI代理已初始化');
    }

    const results = [];
    const totalStartTime = Date.now();
    const { nodeMap, edgeMap } = buildExecutionFlow(nodes, edges);

    console.log(`🚀 开始执行流程，共 ${nodes.length} 个节点`);

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
      console.log(
        `📍 [${executionCount}] 执行节点: ${currentNode.id} (${currentNode.data.type})`
      );

      try {
        let result;
        const { data } = currentNode;

        switch (data.type) {
          case 'navigate':
            console.log(`🌐 导航到: ${data.config.url}`);
            const navigationStartTime = Date.now();
            await page.goto(data.config.url);
            const navigationTime = Date.now() - navigationStartTime;
            result = {
              success: true,
              message: `导航到 ${data.config.url}`,
              executionTime: navigationTime,
            };
            break;

          case 'aiTap':
            console.log(`👆 AI点击: "${data.config.target}"`);
            const tapStartTime = Date.now();
            const tapResult = await agent.aiTap(data.config.target);
            const tapTime = Date.now() - tapStartTime;
            result = {
              success: true,
              message: `AI点击: ${data.config.target}`,
              executionTime: tapTime,
              aiResult: tapResult,
            };
            break;

          case 'aiAction':
            console.log(`⌨️ AI Action: "${data.config.target}" `);
            const actionStartTime = Date.now();
            const actionResult = await agent.aiInput(data.config.target);
            const actionTime = Date.now() - actionStartTime;
            result = {
              success: true,
              message: `AI aiAction: ${data.config.target}`,
              executionTime: actionTime,
              aiResult: actionResult,
            };
            break;

          case 'aiInput':
            console.log(
              `⌨️ AI输入: "${data.config.target}" = "${data.config.value}"`
            );
            const inputStartTime = Date.now();
            const inputResult = await agent.aiInput(
              data.config.value,
              data.config.target
            );
            const inputTime = Date.now() - inputStartTime;
            result = {
              success: true,
              message: `AI输入: ${data.config.value}`,
              executionTime: inputTime,
              aiResult: inputResult,
            };
            break;
          case 'aiQuery':
            console.log(`✅ AI验证: "${data.config.instruction}"`);
            await page.waitForLoadState('networkidle');
            const assertStartTime = Date.now();
            try {
              const assertResult = await agent.aiQuery(data.config.instruction);
              const assertTime = Date.now() - assertStartTime;
              result = {
                success: true,
                message: `AI验证成功: ${data.config.instruction}`,
                executionTime: assertTime,
                data: assertResult,
                branchType: 'success',
              };
              console.log(`✅ 验证成功，将走成功分支`);
            } catch (assertError) {
              const assertTime = Date.now() - assertStartTime;
              result = {
                success: false,
                message: `AI验证失败: ${assertError.message}`,
                executionTime: assertTime,
                error: assertError.message,
                branchType: 'failure',
              };
              console.log(`❌ 验证失败，将走失败分支`);
            }
            break;

          case 'end':
            console.log(`🏁 到达结束节点，关闭浏览器`);
            if (browser) {
              await browser.close();
              browser = null;
              context = null;
              page = null;
              agent = null;
            }
            result = {
              success: true,
              message: '测试结束，浏览器已关闭',
              executionTime: 0,
            };
            break;

          case 'screenshot':
            console.log(`📸 截取整张页面截图`);
            const screenshotStartTime = Date.now();
            // 截图到内存中，不保存到本地文件
            const screenshotBuffer = await page.screenshot({ type: 'png' });
            // 转换为 base64 格式
            const screenshotBase64 = `data:image/png;base64,${screenshotBuffer.toString(
              'base64'
            )}`;
            const screenshotTime = Date.now() - screenshotStartTime;
            result = {
              success: true,
              message: '截图已生成',
              screenshotData: screenshotBase64,
              executionTime: screenshotTime,
            };
            break; 

          case 'waitForTimeout':
            console.log(`⏰ 等待: ${data.config.value}`);
            const waitStartTime = Date.now();
            isNaN(Number(data.config.value))
              ? await agent.aiWaitFor(data.config.value)
              : await page.waitForTimeout(Number(data.config.value));
            const actualWaitTime = Date.now() - waitStartTime;
            result = {
              success: true,
              message: `等待 ${data.config.value}ms`,
              executionTime: actualWaitTime,
            };
            break;

          default:
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

        console.log(`✅ 节点 ${currentNode.id} 执行成功`);

        // 获取下一个节点
        const nextNode = getNextNode(currentNode.id, result, edgeMap, nodeMap);
        if (nextNode) {
          console.log(
            `➡️ 下一个节点: ${nextNode.id} (条件: ${
              result.branchType || '无条件'
            })`
          );
        } else {
          console.log(`🏁 没有更多节点，流程结束`);
        }
        currentNode = nextNode;
      } catch (error) {
        console.log(`❌ 节点 ${currentNode.id} 执行失败: ${error.message}`);
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
        if (nextNode) {
          console.log(`➡️ 执行失败，走失败分支到: ${nextNode.id}`);
          currentNode = nextNode;
        } else {
          console.log(`🏁 没有失败分支，流程结束`);
          break;
        }
      }
    }

    if (executionCount >= maxExecutions) {
      console.log(`⚠️ 达到最大执行次数限制，强制结束流程`);
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
      nodeResults, // 添加节点结果映射，前端用于更新节点状态和截图
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

// 清理资源
process.on('SIGINT', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 MidsceneJS执行服务器启动: http://localhost:${PORT}`);
});
