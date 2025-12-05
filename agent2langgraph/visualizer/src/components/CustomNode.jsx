import React from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data }) => {
  const { label, icon, description, nodeType } = data;
  
  return (
    <div className={`custom-node ${nodeType}`}>
      <Handle type="target" position={Position.Left} />
      
      <div className="node-icon">{icon}</div>
      <div className="node-title">{label}</div>
      <div className="node-description">{description}</div>
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default CustomNode;
