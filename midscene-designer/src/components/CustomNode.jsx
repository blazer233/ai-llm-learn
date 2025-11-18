import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import ScreenshotPreview from './ScreenshotPreview';

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
      <Handle type="target" position={Position.Left} />
      
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
              padding: '2px',
              marginLeft: '8px'
            }}
            title="查看截图"
          >
            [预览]
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
        <ScreenshotPreview 
          screenshotData={data.screenshotData}
          onClose={() => setShowScreenshot(false)}
        />
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
          {data.executionStatus === 'success' ? '√' : 
           data.executionStatus === 'error' ? '×' : 
           data.executionStatus === 'running' ? '...' : ''}
        </div>
      )}
      
      {/* 根据节点类型显示不同的输出连接点 */}
      {data.type === 'aiBoolean' ? (
        <>
          <Handle 
            type="source" 
            position={Position.Right} 
            id="success"
            style={{ top: '25%', background: '#10b981' }}
          />
          <div style={{
            position: 'absolute',
            right: -15,
            top: '15%',
            fontSize: 8,
            color: '#10b981',
            fontWeight: 'bold'
          }}>
          </div>
          
          <Handle 
            type="source" 
            position={Position.Right} 
            id="failure"
            style={{ top: '75%', background: '#ef4444' }}
          />
          <div style={{
            position: 'absolute',
            right: -15,
            bottom: '15%',
            fontSize: 8,
            color: '#ef4444',
            fontWeight: 'bold'
          }}>
          </div>
        </>
      ) : data.type === 'end' ? (
        null
      ) : (
        <Handle type="source" position={Position.Right} />
      )}
    </div>
  );
};

export default CustomNode;

