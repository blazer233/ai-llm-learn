import './globals.css';

export const metadata = {
  title: 'A2UI Next.js App',
  description: '基于 Google A2UI 的智能对话界面应用',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
