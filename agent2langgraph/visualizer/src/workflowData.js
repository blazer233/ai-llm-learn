/**
 * LangGraph 工作流的 React Flow 数据映射
 * 
 * 对应关系:
 * __start__ → do_research → do_review → [条件判断]
 *                              ↑            ├─→ END (通过评审或达到最大迭代)
 *                              └── do_revise ← (需要修改)
 */

const nodeWidth = 200;
const nodeHeight = 100;
const horizontalGap = 250;
const verticalGap = 200;

export const initialNodes = [
  {
    id: 'start',
    type: 'custom',
    position: { x: 100, y: 200 },
    data: { 
      label: '__start__',
      icon: '🚀',
      description: '工作流起点',
      nodeType: 'start',
    },
  },
  {
    id: 'do_research',
    type: 'custom',
    position: { x: 100 + horizontalGap, y: 200 },
    data: { 
      label: 'do_research',
      icon: '📚',
      description: 'ResearcherAgent 执行研究',
      nodeType: 'process',
    },
  },
  {
    id: 'do_review',
    type: 'custom',
    position: { x: 100 + horizontalGap * 2, y: 200 },
    data: { 
      label: 'do_review',
      icon: '🔍',
      description: 'ReviewerAgent 进行评审',
      nodeType: 'process',
    },
  },
  {
    id: 'do_revise',
    type: 'custom',
    position: { x: 100 + horizontalGap * 2, y: 200 + verticalGap },
    data: { 
      label: 'do_revise',
      icon: '✏️',
      description: 'ResearcherAgent 根据反馈修改',
      nodeType: 'process',
    },
  },
  {
    id: 'end',
    type: 'custom',
    position: { x: 100 + horizontalGap * 3, y: 200 },
    data: { 
      label: 'END',
      icon: '🎉',
      description: '工作流终点',
      nodeType: 'end',
    },
  },
];

export const initialEdges = [
  {
    id: 'e-start-research',
    source: 'start',
    target: 'do_research',
    label: '开始',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 },
  },
  {
    id: 'e-research-review',
    source: 'do_research',
    target: 'do_review',
    label: '提交研究',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#8b5cf6', strokeWidth: 2 },
  },
  {
    id: 'e-review-end',
    source: 'do_review',
    target: 'end',
    label: '✅ 通过评审',
    type: 'smoothstep',
    className: 'conditional',
    style: { stroke: '#10b981', strokeWidth: 2.5 },
  },
  {
    id: 'e-review-revise',
    source: 'do_review',
    target: 'do_revise',
    label: '❌ 需要修改',
    type: 'smoothstep',
    className: 'conditional',
    style: { stroke: '#ef4444', strokeWidth: 2.5 },
  },
  {
    id: 'e-revise-review',
    source: 'do_revise',
    target: 'do_review',
    label: '重新评审',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#f59e0b', strokeWidth: 2 },
  },
];
