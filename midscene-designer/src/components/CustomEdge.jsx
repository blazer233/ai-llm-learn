import React from 'react';
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getEdgeColor = () => {
    if (data?.condition === 'success') return '#10b981';
    if (data?.condition === 'failure') return '#ef4444';
    return '#b1b1b7';
  };

  const getEdgeLabel = () => {
    if (data?.condition === 'success') return '✅ 是';
    if (data?.condition === 'failure') return '❌ 否';
    return '';
  };

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd}
        style={{ 
          stroke: getEdgeColor(),
          strokeWidth: 2
        }}
      />
      <EdgeLabelRenderer>
        {getEdgeLabel() && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              fontWeight: 'bold',
              background: 'white',
              padding: '2px 6px',
              borderRadius: 4,
              border: `1px solid ${getEdgeColor()}`,
              color: getEdgeColor(),
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {getEdgeLabel()}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;