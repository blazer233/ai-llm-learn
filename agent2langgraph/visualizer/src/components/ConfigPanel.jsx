import React, { useState, useEffect } from 'react';
import './ConfigPanel.css';

const ConfigPanel = ({ node, onUpdate, onClose }) => {
  const [label, setLabel] = useState(node.data.label);
  const [systemPrompt, setSystemPrompt] = useState(node.data.config?.systemPrompt || '');
  const [temperature, setTemperature] = useState(node.data.config?.temperature || 0.7);

  useEffect(() => {
    setLabel(node.data.label);
    setSystemPrompt(node.data.config?.systemPrompt || '');
    setTemperature(node.data.config?.temperature || 0.7);
  }, [node]);

  const handleSave = () => {
    onUpdate(node.id, {
      label,
      config: {
        systemPrompt,
        temperature,
      },
    });
    onClose();
  };

  if (node.data.agentType === 'start' || node.data.agentType === 'end') {
    return (
      <div className="config-panel">
        <div className="panel-header">
          <h3>⚙️ 节点配置</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        <div className="panel-content">
          <div className="form-group">
            <label>节点名称</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="输入节点名称"
            />
          </div>
          <p className="info-text">
            {node.data.agentType === 'start' ? '起始节点不需要额外配置' : '结束节点不需要额外配置'}
          </p>
        </div>
        <div className="panel-footer">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    );
  }

  return (
    <div className="config-panel">
      <div className="panel-header">
        <h3>⚙️ Agent 配置</h3>
        <button className="close-button" onClick={onClose}>✕</button>
      </div>
      
      <div className="panel-content">
        <div className="form-group">
          <label>Agent 名称</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="输入 Agent 名称"
          />
        </div>

        <div className="form-group">
          <label>系统提示词</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="输入系统提示词，定义 Agent 的角色和任务..."
            rows={8}
          />
        </div>

        <div className="form-group">
          <label>Temperature: {temperature}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
          />
          <div className="slider-labels">
            <span>精确 (0)</span>
            <span>创造 (1)</span>
          </div>
        </div>

        <div className="info-box">
          <strong>节点 ID:</strong> {node.id}<br />
          <strong>类型:</strong> {node.data.agentType}
        </div>
      </div>

      <div className="panel-footer">
        <button className="btn-secondary" onClick={onClose}>取消</button>
        <button className="btn-primary" onClick={handleSave}>保存</button>
      </div>
    </div>
  );
};

export default ConfigPanel;
