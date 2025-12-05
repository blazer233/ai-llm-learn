import React from 'react';
import './NodePalette.css';

const NodePalette = () => {
  const onDragStart = (event, agentType) => {
    event.dataTransfer.setData('application/reactflow', 'agentNode');
    event.dataTransfer.setData('agentType', agentType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const nodeTypes = [
    { type: 'start', icon: '🚀', label: 'Start', description: '工作流起点' },
    { type: 'researcher', icon: '📚', label: 'Researcher', description: '研究员 Agent' },
    { type: 'reviewer', icon: '🔍', label: 'Reviewer', description: '评审员 Agent' },
    { type: 'writer', icon: '✍️', label: 'Writer', description: '写作 Agent' },
    { type: 'custom', icon: '⚙️', label: 'Custom', description: '自定义 Agent' },
    { type: 'end', icon: '🎉', label: 'End', description: '工作流终点' },
  ];

  return (
    <div className="node-palette">
      <div className="palette-header">
        <h3>🎨 节点面板</h3>
        <p>拖拽节点到画布</p>
      </div>
      
      <div className="palette-items">
        {nodeTypes.map((node) => (
          <div
            key={node.type}
            className={`palette-item ${node.type}`}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
          >
            <span className="palette-icon">{node.icon}</span>
            <div className="palette-info">
              <div className="palette-label">{node.label}</div>
              <div className="palette-description">{node.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="palette-tips">
        <h4>💡 使用提示</h4>
        <ul>
          <li>拖拽节点到画布创建 Agent</li>
          <li>连接节点定义执行流程</li>
          <li>点击节点配置参数</li>
          <li>从 Start 节点开始，End 节点结束</li>
        </ul>
      </div>
    </div>
  );
};

export default NodePalette;
