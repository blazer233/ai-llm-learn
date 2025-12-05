import React from 'react';
import { Handle, Position } from 'reactflow';
import './AgentNode.css';

const AgentNode = ({ data, selected }) => {
  const { label, agentType, status } = data;

  const getIcon = () => {
    switch (agentType) {
      case 'start':
        return '🚀';
      case 'end':
        return '🎉';
      case 'researcher':
        return '📚';
      case 'reviewer':
        return '🔍';
      case 'writer':
        return '✍️';
      case 'custom':
        return '⚙️';
      default:
        return '🤖';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return '⏳';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '';
    }
  };

  return (
    <div className={`agent-node ${agentType} ${status} ${selected ? 'selected' : ''}`}>
      {agentType !== 'start' && (
        <Handle type="target" position={Position.Left} className="handle" />
      )}
      
      <div className="node-header">
        <span className="node-icon">{getIcon()}</span>
        <span className="status-icon">{getStatusIcon()}</span>
      </div>
      
      <div className="node-content">
        <div className="node-label">{label}</div>
        <div className="node-type">{agentType}</div>
      </div>
      
      {agentType !== 'end' && (
        <Handle type="source" position={Position.Right} className="handle" />
      )}
    </div>
  );
};

export default AgentNode;
