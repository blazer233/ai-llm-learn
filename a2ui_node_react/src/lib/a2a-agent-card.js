/**
 * A2A Agent Card Configuration
 * 定义 Agent 的身份、能力和配置
 */

export function getAgentCard() {
  return {
    name: 'A2UI Assistant',
    version: '1.0.0',
    description: '智能 UI 生成助手，基于自然语言生成 TDesign 组件界面',
    capabilities: {
      a2ui: true,
      streaming: false,
      context: true
    },
    configuration: {
      maxTokens: 2000,
      temperature: 0.7
    }
  };
}
