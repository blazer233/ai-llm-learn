import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import AgentNode from './components/AgentNode';
import NodePalette from './components/NodePalette';
import ExecutionPanel from './components/ExecutionPanel';
import ConfigPanel from './components/ConfigPanel';
import { checkHealth, executeVisualWorkflow } from './services/api';
import './App.css';

const nodeTypes = {
  agentNode: AgentNode,
};

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

const App = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState([]);
  const [serverStatus, setServerStatus] = useState('checking'); // checking | online | offline
  const [workflowInput, setWorkflowInput] = useState('请研究人工智能的发展历程');
  const [config, setConfig] = useState({
    apiKey: import.meta.env.VITE_HUNYUAN_API_KEY || '',
    baseURL: import.meta.env.VITE_HUNYUAN_BASE_URL || 'http://hunyuanapi.woa.com/openapi/v1',
    modelName: import.meta.env.VITE_HUNYUAN_MODEL || 'hunyuan-lite',
    maxIterations: parseInt(import.meta.env.VITE_MAX_ITERATIONS) || 3,
  });

  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // 检查服务器状态
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        await checkHealth();
        setServerStatus('online');
        setExecutionLog(prev => [...prev, {
          type: 'success',
          message: '✅ 后端服务已连接',
          timestamp: new Date().toISOString(),
        }]);
      } catch (error) {
        setServerStatus('offline');
        setExecutionLog(prev => [...prev, {
          type: 'error',
          message: '❌ 后端服务未启动，请运行: npm run server',
          timestamp: new Date().toISOString(),
        }]);
      }
    };

    checkServerHealth();
    const interval = setInterval(checkServerHealth, 30000); // 每 30 秒检查一次

    return () => clearInterval(interval);
  }, []);

  // 连接节点
  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // 拖拽添加节点
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const agentType = event.dataTransfer.getData('agentType');

      if (!type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: {
          label: agentType === 'start' ? 'Start' : agentType === 'end' ? 'End' : `Agent ${nodeId}`,
          agentType,
          config: {
            systemPrompt: getDefaultPrompt(agentType),
            temperature: 0.7,
          },
          status: 'idle', // idle | running | completed | error
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // 节点点击
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // 删除节点
  const onNodesDelete = useCallback(
    (deleted) => {
      setSelectedNode(null);
    },
    []
  );

  // 更新节点配置
  const updateNodeConfig = useCallback(
    (nodeId, newConfig) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...newConfig,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // 执行工作流
  const handleExecute = useCallback(async () => {
    if (nodes.length === 0) {
      alert('请先添加节点！');
      return;
    }

    if (serverStatus !== 'online') {
      alert('后端服务未启动！请运行: npm run server');
      return;
    }

    setExecuting(true);
    setExecutionLog([{
      type: 'info',
      message: '🚀 开始执行工作流...',
      timestamp: new Date().toISOString(),
    }]);

    // 重置所有节点状态
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, status: 'idle' },
      }))
    );

    try {
      // 调用后端 API
      const response = await executeVisualWorkflow(
        nodes,
        edges,
        workflowInput,
        {
          modelName: config.modelName,
          maxIterations: config.maxIterations,
        }
      );

      // 处理日志
      if (response.logs) {
        response.logs.forEach(log => {
          setExecutionLog((logs) => [...logs, {
            ...log,
            timestamp: log.timestamp || new Date().toISOString(),
          }]);
        });
      }

      // 更新节点状态
      if (response.data && response.data.history) {
        response.data.history.forEach(item => {
          const nodeId = nodes.find(n => n.data.label === item.node)?.id;
          if (nodeId) {
            setNodes((nds) =>
              nds.map((node) => {
                if (node.id === nodeId) {
                  return {
                    ...node,
                    data: { ...node.data, status: 'completed' },
                  };
                }
                return node;
              })
            );
          }
        });
      }

      setExecutionLog((logs) => [
        ...logs,
        {
          type: 'success',
          message: '✅ 工作流执行完成！',
          timestamp: new Date().toISOString(),
          data: response.data,
        },
      ]);
    } catch (error) {
      setExecutionLog((logs) => [
        ...logs,
        {
          type: 'error',
          message: `❌ 执行失败: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setExecuting(false);
    }
  }, [nodes, edges, config, serverStatus, workflowInput, setNodes]);

  // 清空画布
  const handleClear = useCallback(() => {
    if (window.confirm('确定要清空所有节点吗？')) {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
      setExecutionLog([]);
    }
  }, [setNodes, setEdges]);

  // 保存工作流
  const handleSave = useCallback(() => {
    const workflow = {
      nodes,
      edges,
      config,
    };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow_${Date.now()}.json`;
    a.click();
  }, [nodes, edges, config]);

  // 加载工作流
  const handleLoad = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target.result);
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
        setConfig(workflow.config || config);
      } catch (error) {
        alert('加载失败：' + error.message);
      }
    };
    reader.readAsText(file);
  }, [setNodes, setEdges, config]);

  return (
    <div className="app-container">
      <NodePalette />
      
      <div className="main-content" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodesDelete={onNodesDelete}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#f0f0f0" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.data.agentType) {
                case 'start':
                  return '#6366f1';
                case 'end':
                  return '#10b981';
                case 'researcher':
                  return '#8b5cf6';
                case 'reviewer':
                  return '#f59e0b';
                default:
                  return '#64748b';
              }
            }}
            nodeStrokeWidth={3}
          />
          
          <Panel position="top-center">
            <div className="toolbar">
              <div className="server-status">
                {serverStatus === 'online' ? '🟢' : serverStatus === 'offline' ? '🔴' : '🟡'}
                <span>{serverStatus === 'online' ? '后端在线' : serverStatus === 'offline' ? '后端离线' : '检查中...'}</span>
              </div>
              <input
                type="text"
                value={workflowInput}
                onChange={(e) => setWorkflowInput(e.target.value)}
                placeholder="输入工作流的研究主题..."
                className="workflow-input"
              />
              <button onClick={handleExecute} disabled={executing || serverStatus !== 'online'}>
                {executing ? '⏳ 执行中...' : '▶️ 执行工作流'}
              </button>
              <button onClick={handleClear}>🗑️ 清空</button>
              <button onClick={handleSave}>💾 保存</button>
              <label className="load-button">
                📂 加载
                <input
                  type="file"
                  accept=".json"
                  onChange={handleLoad}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {selectedNode && (
        <ConfigPanel
          node={selectedNode}
          onUpdate={updateNodeConfig}
          onClose={() => setSelectedNode(null)}
        />
      )}

      <ExecutionPanel
        logs={executionLog}
        executing={executing}
        config={config}
        onConfigChange={setConfig}
      />
    </div>
  );
};

// 获取默认 Prompt
function getDefaultPrompt(agentType) {
  switch (agentType) {
    case 'researcher':
      return `你是一位专业的研究员。你的任务是：
1. 深入研究给定的主题
2. 提供详细的分析和见解
3. 给出有根据的结论
4. 用清晰、专业的语言表达`;
    case 'reviewer':
      return `你是一位严谨的评审专家。你的任务是：
1. 仔细评审研究内容的质量
2. 检查逻辑性、完整性和准确性
3. 提供建设性的反馈意见
4. 判断内容是否达到发布标准`;
    case 'writer':
      return `你是一位专业的写作专家。你的任务是：
1. 将研究内容转化为易读的文章
2. 保持内容的准确性和专业性
3. 优化语言表达和文章结构`;
    default:
      return '请输入此 Agent 的系统提示词...';
  }
}

export default App;
