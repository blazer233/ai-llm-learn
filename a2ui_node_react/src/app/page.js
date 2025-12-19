'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import A2UITDesignRenderer from '@/components/A2UITDesignRenderer';
import { Divider } from 'tdesign-react';

export default function Home() {
  const [currentA2UI, setCurrentA2UI] = useState(null);

  const handleA2UIGenerated = (a2ui) => {
    console.log('🎨 Page received A2UI:', a2ui);
    setCurrentA2UI(a2ui);
  };

  return (
    <div className="page-container">
      {/* 左侧对话区 */}
      <div className="chat-area">
        <ChatInterface onA2UIGenerated={handleA2UIGenerated} />
      </div>

      {/* 分隔线 */}
      {currentA2UI && <Divider layout="vertical" className="divider" />}

      {/* 右侧预览区 */}
      {currentA2UI && (
        <div className="preview-area">
          <A2UITDesignRenderer a2ui={currentA2UI} />
        </div>
      )}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
        }

        .page-container {
          display: flex;
          height: 100vh;
          background: #f5f7fa;
          overflow: hidden;
        }

        .chat-area {
          flex: 1;
          min-width: 400px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .divider {
          margin: 0 !important;
        }

        .preview-area {
          flex: 1;
          background: white;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* 响应式 */
        @media (max-width: 1024px) {
          .page-container {
            flex-direction: column;
          }

          .chat-area {
            min-width: unset;
            height: 50vh;
          }

          .preview-area {
            height: 50vh;
          }

          .divider {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

