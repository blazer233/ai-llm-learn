/**
 * 抑制第三方库的已知警告
 * 这些警告来自 CopilotKit/Radix UI 内部依赖，不影响功能
 */

if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  // 需要抑制的警告关键词
  const suppressKeywords = [
    'Function components cannot be given refs',
    'forwardRef',
    'SlotClone',
    'Primitive.button',
    'DropdownMenuTrigger',
  ];

  const shouldSuppress = (...args) => {
    const message = args.join(' ');
    return suppressKeywords.some(keyword => message.includes(keyword));
  };

  console.error = (...args) => {
    if (!shouldSuppress(...args)) {
      originalError.apply(console, args);
    }
  };

  console.warn = (...args) => {
    if (!shouldSuppress(...args)) {
      originalWarn.apply(console, args);
    }
  };
}

export {};
