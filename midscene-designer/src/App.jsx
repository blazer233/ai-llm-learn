import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { MIDSCENE_NODE_TYPES, getNodeTypesByCategory } from './nodeTypes';
import CustomNode from './components/CustomNode';
import CustomEdge from './components/CustomEdge';
import MidsceneExecutionService from './services/executionService';

// 流程图管理的本地存储键
const FLOW_LIST_KEY = 'midscene-flow-list';
const CURRENT_FLOW_KEY = 'midscene-current-flow';

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

// ReactFlow 内容组件
function ReactFlowContent({
  nodes, edges, onNodesChange, onEdgesChange, onConnect,
  nodeTypes, edgeTypes, setNodes, isExecuting, executionResults,
  setExecutionResults, executeFlow, generateCode
}) {
  const { screenToFlowPosition } = useReactFlow();

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type) return;

      // 使用 screenToFlowPosition 将屏幕坐标转换为流程图坐标
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeType = MIDSCENE_NODE_TYPES[type];
      const newNode = {
        id: `${type}-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: nodeType.name,
          type: type,
          config: { ...nodeType.config },
          color: nodeType.color,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, screenToFlowPosition]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDrop={onDrop}
      onDragOver={onDragOver}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
    >
      <Controls />
      <MiniMap />
      <Background variant="dots" gap={12} size={1} />

      <Panel position="top-right">
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              const code = generateCode();
              navigator.clipboard.writeText(code);
              alert('代码已复制到剪贴板');
            }}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            📋 复制代码
          </button>
          <button
            onClick={executeFlow}
            disabled={isExecuting || nodes.length === 0}
            style={{
              padding: '8px 16px',
              background: isExecuting ? '#ccc' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: isExecuting ? 'not-allowed' : 'pointer'
            }}
          >
            {isExecuting ? '⏳ 执行中...' : '🚀 执行测试'}
          </button>
        </div>
      </Panel>

      {/* 执行结果 */}
      {executionResults && (
        <Panel position="top-right" style={{ top: 60 }}>
          <div style={{
            width: 300,
            maxHeight: 400,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 15,
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 style={{ margin: 0 }}>🚀 执行结果</h4>
              <button
                onClick={() => setExecutionResults(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>
            {executionResults.results?.map((result, index) => (
              <div key={index} style={{
                padding: 8,
                margin: '5px 0',
                background: result.success ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${result.success ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: 4,
                fontSize: 12
              }}>
                <div style={{ fontWeight: 'bold', color: result.success ? '#16a34a' : '#dc2626' }}>
                  {result.success ? '✅' : '❌'} {result.message}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </ReactFlow>
  );
}

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState(null);
  const [currentFlowName, setCurrentFlowName] = useState('');
  const [savedFlows, setSavedFlows] = useState([]);
  const [showFlowManager, setShowFlowManager] = useState(false);
  const reactFlowWrapper = useRef(null);

  const onConnect = useCallback((params) => {
    // 检查源节点是否是验证节点
    const sourceNode = nodes.find(n => n.id === params.source);
    let newEdge = { ...params, type: 'custom' };
    if (sourceNode?.data.type === 'aiBoolean') {
      // 为验证节点的连接添加条件标识
      const condition = params.sourceHandle === 'success' ? 'success' : 'failure';
      newEdge.data = { condition };
    }
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges, nodes]);

  const executeFlow = useCallback(async () => {
    if (nodes.length === 0) return;

    setIsExecuting(true);

    // 重置所有节点的执行状态
    setNodes(prevNodes =>
      prevNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          executionStatus: null,
          screenshotData: null
        }
      }))
    );

    try {
      const executionService = new MidsceneExecutionService();
      const results = await executionService.executeFlow(nodes, edges);
      setExecutionResults(results);

      // 更新节点状态和截图数据
      if (results.nodeResults) {
        setNodes(prevNodes =>
          prevNodes.map(node => {
            const nodeResult = results.nodeResults.find(r => r.nodeId === node.id);
            if (nodeResult) {
              return {
                ...node,
                data: {
                  ...node.data,
                  executionStatus: nodeResult.success ? 'success' : 'error',
                  screenshotData: nodeResult.screenshotData || node.data.screenshotData
                }
              };
            }
            return node;
          })
        );
      }
    } catch (error) {
      console.error('执行失败:', error);
      alert(`执行失败: ${error.message}`);

      // 标记所有节点为错误状态
      setNodes(prevNodes =>
        prevNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            executionStatus: 'error'
          }
        }))
      );
    } finally {
      setIsExecuting(false);
    }
  }, [nodes, edges, setNodes]);

  const generateCode = () => {
    if (nodes.length === 0) return '';

    let code = `// MidsceneJS 自动生成代码
import { PlaywrightAgent } from '@midscene/web';
import playwright from 'playwright';

async function runTest() {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const agent = new PlaywrightAgent(page);

  try {
`;

    nodes.forEach(node => {
      const { type, config } = node.data;
      switch (type) {
        case 'navigate':
          code += `    await page.goto('${config.url}');\n`;
          break;
        case 'aiAction':
          code += `    await agent.aiAction('${config.target}');\n`;
          break;
        case 'aiTap':
          code += `    await agent.aiTap('${config.target}');\n`;
          break;
        case 'aiInput':
          code += `    await agent.aiInput('${config.target}', '${config.value}');\n`;
          break;
        case 'aiBoolean':
          code += `    await agent.aiBoolean('${config.instruction}');\n`;
          break;
        case 'screenshot':
          code += `    await page.screenshot({ path: 'screenshot.png' });\n`;
          break;
        case 'waitForTimeout':
          code += `    await page.waitForTimeout(${config.value});\n`;
          break;
        case 'end':
          code += `    // 测试结束\n`;
          break;
      }
    });

    code += `  } finally {
    await browser.close();
  }
}

runTest();`;

    return code;
  };

  // 获取所有保存的流程图列表
  const loadFlowList = useCallback(() => {
    try {
      const flowListStr = localStorage.getItem(FLOW_LIST_KEY);
      if (flowListStr) {
        const flowList = JSON.parse(flowListStr);
        setSavedFlows(flowList);
        return flowList;
      }
      return [];
    } catch (error) {
      console.error('加载流程图列表失败:', error);
      return [];
    }
  }, []);

  // 保存流程图列表
  const saveFlowList = useCallback((flowList) => {
    try {
      localStorage.setItem(FLOW_LIST_KEY, JSON.stringify(flowList));
      setSavedFlows(flowList);
    } catch (error) {
      console.error('保存流程图列表失败:', error);
    }
  }, []);

  // 保存整个流程图到本地存储
  const saveFlowToLocal = useCallback((flowName) => {
    try {
      if (!flowName || flowName.trim() === '') {
        alert('请输入流程图名称！');
        return;
      }

      const flowData = {
        name: flowName,
        nodes: nodes,
        edges: edges,
        timestamp: Date.now(),
        updatedAt: new Date().toISOString()
      };

      // 保存流程图数据
      const flowKey = `midscene-flow-${flowName}`;
      localStorage.setItem(flowKey, JSON.stringify(flowData));

      // 更新流程图列表
      const flowList = loadFlowList();
      const existingIndex = flowList.findIndex(f => f.name === flowName);

      if (existingIndex >= 0) {
        flowList[existingIndex] = {
          name: flowName,
          timestamp: flowData.timestamp,
          updatedAt: flowData.updatedAt,
          nodeCount: nodes.length,
          edgeCount: edges.length
        };
      } else {
        flowList.push({
          name: flowName,
          timestamp: flowData.timestamp,
          updatedAt: flowData.updatedAt,
          nodeCount: nodes.length,
          edgeCount: edges.length
        });
      }

      saveFlowList(flowList);
      setCurrentFlowName(flowName);
      localStorage.setItem(CURRENT_FLOW_KEY, flowName);

      alert(`流程图 "${flowName}" 已保存！`);
    } catch (error) {
      console.error('保存流程图失败:', error);
      alert('保存流程图失败，请重试！');
    }
  }, [nodes, edges, loadFlowList, saveFlowList]);

  // 从本地存储加载指定流程图
  const loadFlowFromLocal = useCallback((flowName) => {
    try {
      const flowKey = `midscene-flow-${flowName}`;
      const savedFlow = localStorage.getItem(flowKey);

      if (savedFlow) {
        const flowData = JSON.parse(savedFlow);

        if (flowData.nodes && flowData.edges) {
          setNodes(flowData.nodes);
          setEdges(flowData.edges);
          setCurrentFlowName(flowName);
          localStorage.setItem(CURRENT_FLOW_KEY, flowName);
          console.log(`流程图 "${flowName}" 已加载`);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('加载流程图失败:', error);
      return false;
    }
  }, [setNodes, setEdges]);

  // 删除流程图
  const deleteFlow = useCallback((flowName) => {
    try {
      if (!confirm(`确定要删除流程图 "${flowName}" 吗？`)) {
        return;
      }

      // 删除流程图数据
      const flowKey = `midscene-flow-${flowName}`;
      localStorage.removeItem(flowKey);

      // 更新流程图列表
      const flowList = loadFlowList();
      const newFlowList = flowList.filter(f => f.name !== flowName);
      saveFlowList(newFlowList);

      // 如果删除的是当前流程图，清空画布
      if (currentFlowName === flowName) {
        setNodes([]);
        setEdges([]);
        setCurrentFlowName('');
        localStorage.removeItem(CURRENT_FLOW_KEY);
      }

      alert(`流程图 "${flowName}" 已删除！`);
    } catch (error) {
      console.error('删除流程图失败:', error);
      alert('删除流程图失败，请重试！');
    }
  }, [currentFlowName, loadFlowList, saveFlowList, setNodes, setEdges]);

  // 新建流程图
  const createNewFlow = useCallback(() => {
    if (nodes.length > 0 || edges.length > 0) {
      if (!confirm('当前有未保存的内容，确定要新建流程图吗？')) {
        return;
      }
    }
    setNodes([]);
    setEdges([]);
    setCurrentFlowName('');
    localStorage.removeItem(CURRENT_FLOW_KEY);
  }, [nodes.length, edges.length, setNodes, setEdges]);

  // 页面加载时自动加载上次打开的流程图
  useEffect(() => {
    loadFlowList();
    const lastFlowName = localStorage.getItem(CURRENT_FLOW_KEY);
    if (lastFlowName) {
      loadFlowFromLocal(lastFlowName);
    }
  }, [loadFlowList, loadFlowFromLocal]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* 节点面板 */}
      <div style={{ width: 250, background: '#f5f5f5', padding: 20, overflowY: 'auto' }}>
        <h3>🤖 MidsceneJS 节点</h3>

        {/* 流程图管理按钮 */}
        <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* 当前流程图名称 */}
          {currentFlowName && (
            <div style={{
              padding: '8px 12px',
              background: '#e0f2fe',
              borderRadius: 4,
              fontSize: 12,
              color: '#0369a1',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              📄 {currentFlowName}
            </div>
          )}

          <button
            onClick={createNewFlow}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 'bold'
            }}
          >
            ➕ 新建流程图
          </button>

          <button
            onClick={() => {
              const flowName = prompt('请输入流程图名称:', currentFlowName || '');
              if (flowName) {
                saveFlowToLocal(flowName);
              }
            }}
            disabled={nodes.length === 0 && edges.length === 0}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: (nodes.length === 0 && edges.length === 0) ? '#ccc' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: (nodes.length === 0 && edges.length === 0) ? 'not-allowed' : 'pointer',
              fontSize: 12,
              fontWeight: 'bold'
            }}
          >
            💾 保存流程图
          </button>

          <button
            onClick={() => setShowFlowManager(!showFlowManager)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 'bold'
            }}
          >
            📂 {showFlowManager ? '隐藏' : '管理'}流程图 ({savedFlows.length})
          </button>
        </div>

        {/* 流程图管理面板 */}
        {showFlowManager && (
          <div style={{
            marginBottom: 20,
            padding: 12,
            background: 'white',
            borderRadius: 8,
            border: '1px solid #ddd',
            maxHeight: 300,
            overflowY: 'auto'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: 13, color: '#666' }}>
              已保存的流程图
            </h4>
            {savedFlows.length === 0 ? (
              <div style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: 20 }}>
                暂无保存的流程图
              </div>
            ) : (
              savedFlows.map((flow) => (
                <div
                  key={flow.name}
                  style={{
                    padding: 8,
                    marginBottom: 8,
                    background: currentFlowName === flow.name ? '#e0f2fe' : '#f9fafb',
                    border: `1px solid ${currentFlowName === flow.name ? '#0ea5e9' : '#e5e7eb'}`,
                    borderRadius: 4,
                    fontSize: 11
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#374151' }}>
                    {flow.name}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 6 }}>
                    节点: {flow.nodeCount} | 连线: {flow.edgeCount}
                    <br />
                    更新: {new Date(flow.updatedAt).toLocaleString('zh-CN')}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => {
                        loadFlowFromLocal(flow.name);
                        setShowFlowManager(false);
                      }}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: 3,
                        cursor: 'pointer',
                        fontSize: 10
                      }}
                    >
                      📂 加载
                    </button>
                    <button
                      onClick={() => deleteFlow(flow.name)}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: 3,
                        cursor: 'pointer',
                        fontSize: 10
                      }}
                    >
                      🗑️ 删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {Object.entries(getNodeTypesByCategory()).map(([category, nodeTypes]) => (
          <div key={category} style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, margin: '10px 0 5px 0', color: '#666' }}>
              {category === 'basic' ? '🌐 基础' :
                category === 'ai' ? '🤖 AI功能' :
                  category === 'tool' ? '🛠️ 工具' :
                    category === 'control' ? '🎮 流程控制' : category}
            </h4>
            {nodeTypes.map(nodeType => (
              <div
                key={nodeType.key}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/reactflow', nodeType.key);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                style={{
                  padding: 8,
                  margin: '5px 0',
                  background: nodeType.color,
                  color: 'white',
                  borderRadius: 4,
                  cursor: 'grab',
                  fontSize: 12
                }}
              >
                {nodeType.name}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 主画布 */}
      <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
        <ReactFlowProvider>
          <ReactFlowContent
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            setNodes={setNodes}
            isExecuting={isExecuting}
            executionResults={executionResults}
            setExecutionResults={setExecutionResults}
            executeFlow={executeFlow}
            generateCode={generateCode}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}

export default App;
