import './globals.css';
import '@copilotkit/react-core/v2/styles.css';
import 'tdesign-react/es/style/index.css';

export const metadata = {
  title: 'A2UI 智能界面生成助手',
  description: '基于 CopilotKit + TDesign 的 AI 对话式 UI 生成系统',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
