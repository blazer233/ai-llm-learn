import type { Metadata } from 'next';
import './globals.css';
import 'tdesign-react/es/style/index.css';

export const metadata: Metadata = {
  title: '提示词管理平台',
  description: '专业的 AI 提示词管理和测试平台',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
