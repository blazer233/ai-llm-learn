import React, { useState } from 'react';
import './ExecutionPanel.css';

const ExecutionPanel = ({ logs, executing, config, onConfigChange }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);

  const handleConfigSave = () => {
    onConfigChange(localConfig);
    setShowConfig(false);
  };

  return (
    <div className="execution-panel">
      <div className="panel-header">
        <h3>📊 执行日志</h3>
        <button 
          className="config-toggle"
          onClick={() => setShowConfig(!showConfig)}
        >
          ⚙️
        </button>
      </div>

      {showConfig && (
        <div className="config-section">
          <div className="config-form">
            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={localConfig.apiKey}
                onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                placeholder="输入混元 API Key"
              />
            </div>
            <div className="form-group">
              <label>Base URL</label>
              <input
                type="text"
                value={localConfig.baseURL}
                onChange={(e) => setLocalConfig({ ...localConfig, baseURL: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>模型</label>
              <select
                value={localConfig.modelName}
                onChange={(e) => setLocalConfig({ ...localConfig, modelName: e.target.value })}
              >
                <option value="hunyuan-lite">hunyuan-lite</option>
                <option value="hunyuan-standard">hunyuan-standard</option>
                <option value="hunyuan-pro">hunyuan-pro</option>
              </select>
            </div>
            <div className="form-group">
              <label>最大迭代次数</label>
              <input
                type="number"
                min="1"
                max="10"
                value={localConfig.maxIterations}
                onChange={(e) => setLocalConfig({ ...localConfig, maxIterations: parseInt(e.target.value) })}
              />
            </div>
            <button className="save-config-btn" onClick={handleConfigSave}>
              保存配置
            </button>
          </div>
        </div>
      )}

      <div className="logs-container">
        {logs.length === 0 ? (
          <div className="empty-state">
            <p>暂无执行日志</p>
            <span>点击"执行工作流"开始运行</span>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`log-entry ${log.type}`}>
              <span className="log-time">
                {new Date().toLocaleTimeString()}
              </span>
              <span className="log-message">{log.message}</span>
              {log.data && (
                <pre className="log-data">{JSON.stringify(log.data, null, 2)}</pre>
              )}
            </div>
          ))
        )}
        {executing && (
          <div className="log-entry running">
            <span className="loading-spinner">⏳</span>
            <span className="log-message">执行中...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionPanel;
