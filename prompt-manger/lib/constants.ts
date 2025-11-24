// 应用常量定义

export const LANGUAGES = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
] as const;

export const CATEGORIES = [
  { label: '工具函数', value: 'utility' },
  { label: '数据处理', value: 'data' },
  { label: '业务逻辑', value: 'business' },
  { label: '算法', value: 'algorithm' },
  { label: '网络请求', value: 'network' },
  { label: '其他', value: 'other' },
] as const;

export const AI_MODELS = [
  { label: '通义千问 (Qwen)', value: 'qwen' },
  { label: '腾讯混元 (Hunyuan)', value: 'hunyuan' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'Ollama (本地)', value: 'ollama' },
] as const;
