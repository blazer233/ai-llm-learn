import 'dotenv/config';
import { ResearchReviewWorkflow } from './workflow.js';

/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
  baseURL: 'http://hunyuanapi.woa.com/openapi/v1',
  modelName: 'hunyuan-lite',
  temperature: 0.7,
  maxIterations: 3,
};

/**
 * 默认研究主题
 */
const DEFAULT_TOPIC = '介绍LSB实现错误上报机制';

/**
 * 从环境变量加载配置
 */
function loadConfig() {
  return {
    apiKey: process.env.HUNYUAN_API_KEY || 'dummy-key',
    baseURL: process.env.HUNYUAN_BASE_URL || DEFAULT_CONFIG.baseURL,
    modelName: process.env.HUNYUAN_MODEL || DEFAULT_CONFIG.modelName,
    temperature: DEFAULT_CONFIG.temperature,
    maxIterations: DEFAULT_CONFIG.maxIterations,
  };
}

/**
 * 打印启动信息
 */
function printStartupInfo(config) {
  console.log('🤖 使用混元大模型');
  console.log(`📡 API 地址: ${config.baseURL}`);
  console.log(`🧠 模型: ${config.modelName}\n`);
}

/**
 * 打印最终结果
 */
function printResult(result) {
  const divider = '─'.repeat(39);
  
  console.log('\n\n📊 最终结果');
  console.log('═══════════════════════════════════════');
  console.log(`状态: ${result.approved ? '✅ 已通过' : '⚠️  未通过'}`);
  console.log(`迭代次数: ${result.iteration}`);
  console.log('\n最终研究内容:');
  console.log(divider);
  console.log(result.research);
  console.log(divider);
  
  if (result.feedback) {
    console.log('\n最后反馈:');
    console.log(divider);
    console.log(result.feedback);
    console.log(divider);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    const config = loadConfig();
    printStartupInfo(config);

    const workflow = new ResearchReviewWorkflow(config);
    const topic = process.argv[2] || DEFAULT_TOPIC;
    const result = await workflow.execute(topic);
    
    printResult(result);
  } catch (error) {
    console.error('\n❌ 执行出错:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
