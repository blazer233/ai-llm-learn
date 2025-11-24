// 通用工具函数

/**
 * 安全解析 JSON 字符串
 */
export function safeJSONParse<T>(value: string | T | undefined | null, fallback: T): T {
  if (!value) return fallback;
  if (typeof value !== 'string') return value;
  
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Copy to clipboard error:', error);
    return false;
  }
}
