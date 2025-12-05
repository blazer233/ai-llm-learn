import { StateGraph, END } from '@langchain/langgraph';
import { ResearcherAgent } from './agents/researcher.js';
import { ReviewerAgent } from './agents/reviewer.js';

/**
 * 工作流节点名称常量
 */
const NODE_NAMES = {
  RESEARCH: 'do_research',
  REVIEW: 'do_review',
  REVISE: 'do_revise',
};

/**
 * 工作流路由决策
 */
const ROUTING = {
  CONTINUE: 'continue',
  END: 'end',
};

/**
 * 工作流状态结构
 * @typedef {Object} WorkflowState
 * @property {string} topic - 研究主题
 * @property {string} research - 研究内容(ResearcherAgent 生成)
 * @property {string} feedback - 评审反馈(ReviewerAgent 生成)
 * @property {boolean} approved - 是否通过评审
 * @property {number} iteration - 当前迭代次数
 * @property {number} maxIterations - 最大迭代次数限制
 */

/**
 * 研究-评审工作流
 * 
 * 实现双 Agent 协作模式:
 * 1. ResearcherAgent 负责研究和内容生成
 * 2. ReviewerAgent 负责评审和反馈
 * 3. 通过 LangGraph 编排多轮迭代优化流程
 * 
 * 流程图:
 * __start__ → research → review → [条件判断]
 *                          ↑         ├─→ end (通过评审或达到最大迭代)
 *                          └─ revise ← (需要修改)
 */
export class ResearchReviewWorkflow {
  /**
   * 构造函数
   * @param {Object} config - 配置对象
   * @param {string} [config.modelName] - 模型名称
   * @param {string} [config.baseURL] - API 基础 URL
   * @param {string} [config.apiKey] - API 密钥
   * @param {number} [config.maxIterations=3] - 最大迭代次数
   */
  constructor(config = {}) {
    this.researcher = new ResearcherAgent(config);
    this.reviewer = new ReviewerAgent(config);
    this.maxIterations = config.maxIterations || 3;
    this.graph = this.buildGraph();
  }

  /**
   * 构建 LangGraph 工作流图
   * @returns {CompiledGraph} 编译后的可执行图
   */
  buildGraph() {
    const workflow = new StateGraph({
      channels: this._getStateChannels(),
    });

    this._addNodes(workflow);
    this._addEdges(workflow);

    return workflow.compile();
  }

  /**
   * 定义状态通道
   * @private
   */
  _getStateChannels() {
    return {
      topic: null,
      research: null,
      feedback: null,
      approved: null,
      iteration: null,
      maxIterations: null,
    };
  }

  /**
   * 添加所有节点
   * @private
   */
  _addNodes(workflow) {
    workflow.addNode(NODE_NAMES.RESEARCH, this._createResearchNode());
    workflow.addNode(NODE_NAMES.REVIEW, this._createReviewNode());
    workflow.addNode(NODE_NAMES.REVISE, this._createReviseNode());
  }

  /**
   * 添加所有边和条件边
   * @private
   */
  _addEdges(workflow) {
    workflow.addEdge('__start__', NODE_NAMES.RESEARCH);
    workflow.addEdge(NODE_NAMES.RESEARCH, NODE_NAMES.REVIEW);
    workflow.addEdge(NODE_NAMES.REVISE, NODE_NAMES.REVIEW);
    
    workflow.addConditionalEdges(
      NODE_NAMES.REVIEW,
      this._createRoutingDecision(),
      {
        [ROUTING.CONTINUE]: NODE_NAMES.REVISE,
        [ROUTING.END]: END,
      }
    );
  }

  /**
   * 创建研究节点处理函数
   * @private
   */
  _createResearchNode() {
    return async (state) => {
      this._logNodeExecution('研究', '📚');
      const research = await this.researcher.research(state.topic);
      return { ...state, research, iteration: state.iteration || 0 };
    };
  }

  /**
   * 创建评审节点处理函数
   * @private
   */
  _createReviewNode() {
    return async (state) => {
      this._logNodeExecution('评审', '🔍');
      const { approved, feedback } = await this.reviewer.review(state.research);
      return { ...state, approved, feedback, iteration: state.iteration + 1 };
    };
  }

  /**
   * 创建修改节点处理函数
   * @private
   */
  _createReviseNode() {
    return async (state) => {
      this._logNodeExecution('修改', '✏️');
      const research = await this.researcher.revise(state.research, state.feedback);
      return { ...state, research };
    };
  }

  /**
   * 创建路由决策函数
   * @private
   */
  _createRoutingDecision() {
    return (state) => {
      const maxIterations = state.maxIterations || this.maxIterations;
      
      if (state.approved) {
        console.log('\n✅ 研究内容已通过评审！');
        return ROUTING.END;
      }
      
      if (state.iteration >= maxIterations) {
        console.log(`\n⚠️  已达到最大迭代次数 (${maxIterations})，结束流程`);
        return ROUTING.END;
      }
      
      console.log(`\n🔄 需要修改，进入第 ${state.iteration} 次迭代...`);
      return ROUTING.CONTINUE;
    };
  }

  /**
   * 记录节点执行日志
   * @private
   */
  _logNodeExecution(nodeName, icon) {
    console.log('\n═══════════════════════════════════════');
    console.log(`${icon} 执行${nodeName}节点`);
    console.log('═══════════════════════════════════════');
  }

  /**
   * 创建初始状态
   * @private
   */
  _createInitialState(topic) {
    return {
      topic,
      research: '',
      feedback: '',
      approved: false,
      iteration: 0,
      maxIterations: this.maxIterations,
    };
  }

  /**
   * 执行工作流 - 对外暴露的主入口
   * @param {string} topic - 研究主题
   * @returns {Promise<WorkflowState>} 最终状态对象
   */
  async execute(topic) {
    console.log('\n🚀 启动研究-评审工作流');
    console.log(`📋 研究主题: ${topic}\n`);
    
    const initialState = this._createInitialState(topic);
    const result = await this.graph.invoke(initialState);
    
    console.log('\n═══════════════════════════════════════');
    console.log('🎉 工作流执行完成');
    console.log('═══════════════════════════════════════');
    
    return result;
  }
}
