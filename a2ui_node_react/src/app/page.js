'use client';

import '@/lib/suppress-warnings';
import { CopilotChat, CopilotKitProvider } from '@copilotkit/react-core/v2';
import { createTDesignA2UIRenderer } from '@/lib/tdesign-a2ui-renderer';

export const dynamic = 'force-dynamic';

const activityRenderers = [createTDesignA2UIRenderer()];

export default function Home() {
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      showDevConsole="auto"
      renderActivityMessages={activityRenderers}
    >
      <div
        style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <header
          style={{ padding: '20px', background: '#0052d9', color: '#fff' }}
        >
          <h1 style={{ margin: 0, fontSize: '24px' }}>A2UI 智能界面生成</h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
            💬 自然语言 | 🎨 TDesign | 🤖 AI 驱动
          </p>
        </header>

        {/* Chat */}
        <main
          style={{
            flex: 1,
            overflow: 'hidden',
            padding: '20px',
            background: '#f5f5f5',
          }}
        >
          <CopilotChat placeholder="描述您想要的界面，例如：创建一个用户注册表单" />
        </main>
      </div>
    </CopilotKitProvider>
  );
}
