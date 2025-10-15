import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { MIDSCENE_NODE_TYPES } from '../nodeTypes';

const CustomNode = ({ data, id }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState(data.config || {});
  const [showScreenshot, setShowScreenshot] = useState(false);

  const handleConfigChange = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    data.config = newConfig;
  };

  const renderConfigInput = (key, value) => {
    return (
      <div key={key} style={{ margin: '5px 0' }}>
        <label style={{ fontSize: 10, color: '#666' }}>{key}:</label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleConfigChange(key, e.target.value)}
          style={{
            width: '100%',
            padding: 2,
            fontSize: 10,
            border: '1px solid #ddd',
            borderRadius: 2
          }}
        />
      </div>
    );
  };

  return (
    <div style={{
      background: 'white',
      border: `2px solid ${data.color}`,
      borderRadius: 8,
      padding: 10,
      minWidth: 150,
      fontSize: 12,
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Top} />
      
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: 5,
        color: data.color,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }} onClick={() => setIsEditing(!isEditing)}>
        <span>{data.label}</span>
        {data.type === 'screenshot' && data.screenshotData && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowScreenshot(!showScreenshot);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '2px'
            }}
            title="查看截图"
          >
            🖼️
          </button>
        )}
      </div>
      
      {isEditing && (
        <div style={{ 
          background: '#f9f9f9', 
          padding: 8, 
          borderRadius: 4,
          marginTop: 5
        }}>
          {Object.entries(config).map(([key, value]) => 
            renderConfigInput(key, value)
          )}
        </div>
      )}

      {/* 截图预览 */}
      {data.type === 'screenshot' && showScreenshot && data.screenshotData && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 1000,
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: '300px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>截图预览</span>
            <button
              onClick={() => setShowScreenshot(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✕
            </button>
          </div>
          <img
            src={data.screenshotData}
            alt="截图"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '200px',
              objectFit: 'contain',
              border: '1px solid #eee',
              borderRadius: 4
            }}
          />
          <div style={{
            marginTop: 8,
            display: 'flex',
            gap: 8
          }}>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = data.screenshotData;
                link.download = `screenshot-${Date.now()}.png`;
                link.click();
              }}
              style={{
                padding: '4px 8px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              下载
            </button>
            <button
              onClick={() => {
                window.open(data.screenshotData, '_blank');
              }}
              style={{
                padding: '4px 8px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              查看大图
            </button>
          </div>
        </div>
      )}

      {/* 执行状态指示器 */}
      {data.executionStatus && (
        <div style={{
          position: 'absolute',
          top: -8,
          right: -8,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: data.executionStatus === 'success' ? '#10b981' : 
                     data.executionStatus === 'error' ? '#ef4444' : 
                     data.executionStatus === 'running' ? '#f59e0b' : '#6b7280',
          border: '2px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          color: 'white'
        }}>
          {data.executionStatus === 'success' ? '✓' : 
           data.executionStatus === 'error' ? '✗' : 
           data.executionStatus === 'running' ? '⟳' : ''}
        </div>
      )}
      
      {/* 根据节点类型显示不同的输出连接点 */}
      {data.type === 'aiQuery' ? (
        <>
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="success"
            style={{ left: '25%', background: '#10b981' }}
          />
          <div style={{
            position: 'absolute',
            bottom: -15,
            left: '15%',
            fontSize: 8,
            color: '#10b981',
            fontWeight: 'bold'
          }}>
            成功
          </div>
          
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="failure"
            style={{ left: '75%', background: '#ef4444' }}
          />
          <div style={{
            position: 'absolute',
            bottom: -15,
            right: '15%',
            fontSize: 8,
            color: '#ef4444',
            fontWeight: 'bold'
          }}>
            失败
          </div>
        </>
      ) : data.type === 'end' ? (
        null
      ) : (
        <Handle type="source" position={Position.Bottom} />
      )}
    </div>
  );
};

export default CustomNode;

