'use client';

import { useState, useRef, useEffect } from 'react';
import { a2aClient } from '@/lib/a2a-client';
import {
  Space,
  Button,
  Textarea,
  Avatar,
  Loading,
  Typography,
  Divider,
  Tag,
  MessagePlugin,
} from 'tdesign-react';

const { Text, Title } = Typography;

const ChatInterface = ({ onA2UIGenerated }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const contextIdRef = useRef(null);

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input;
    setInput('');

    // 添加用户消息
    const userMessage = {
      role: 'user',
      content: userInput,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 调用 A2A Client
      const response = await a2aClient.sendMessage(userInput, {
        contextId: contextIdRef.current,
      });

      // 保存 contextId 以维持会话
      if (response.contextId) {
        contextIdRef.current = response.contextId;
      }

      // 添加 AI 回复消息
      const aiMessage = {
        role: 'assistant',
        content: response.text || '已生成界面',
      };
      setMessages((prev) => [...prev, aiMessage]);

      // 如果有 A2UI，触发回调
      if (response.a2ui) {
        console.log('✅ A2UI received:', response.a2ui);
        onA2UIGenerated(response.a2ui);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // 添加错误消息
      const errorMessage = {
        role: 'assistant',
        content: `抱歉，处理您的请求时出错：${error.message}`,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      
      MessagePlugin.error(`发送失败：${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const examples = [
    '创建一个用户注册表单',
    '制作一个餐厅预订界面',
    '生成一个商品搜索页面',
  ];

  return (
    <div className="chat-container">
      {/* 头部 */}
      <div className="chat-header">
        <Title level={4} style={{ margin: 0 }}>
          🤖 A2UI Assistant
        </Title>
        <Text theme="secondary">基于 TDesign 的智能界面生成</Text>
      </div>

      <Divider style={{ margin: 0 }} />

      {/* 消息列表 */}
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="welcome-message">
            <Text theme="secondary" style={{ display: 'block', marginBottom: '16px' }}>
              告诉我您想要什么界面，我将为您实时生成
            </Text>
            <Space direction="vertical" size="small">
              <Text theme="secondary" style={{ fontSize: '12px' }}>
                示例：
              </Text>
              {examples.map((example, index) => (
                <Tag
                  key={index}
                  theme="primary"
                  variant="outline"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setInput(example)}
                >
                  {example}
                </Tag>
              ))}
            </Space>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}
            >
              <Avatar
                size="small"
                style={{
                  backgroundColor: msg.role === 'user' ? '#0052d9' : msg.isError ? '#e34d59' : '#f2f3f5',
                  color: msg.role === 'user' ? 'white' : msg.isError ? 'white' : '#0052d9',
                  flexShrink: 0,
                }}
              >
                {msg.role === 'user' ? '我' : 'AI'}
              </Avatar>
              <div className="message-content" style={{ 
                borderColor: msg.isError ? '#e34d59' : undefined 
              }}>
                <Text style={{ color: msg.isError ? '#e34d59' : undefined }}>
                  {msg.content}
                </Text>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="message ai-message">
            <Avatar
              size="small"
              style={{ backgroundColor: '#f2f3f5', color: '#0052d9', flexShrink: 0 }}
            >
              AI
            </Avatar>
            <div className="message-content">
              <Loading size="small" text="正在生成界面..." />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <Divider style={{ margin: 0 }} />

      {/* 输入区 */}
      <div className="input-area">
        <Textarea
          value={input}
          onChange={(value) => setInput(value)}
          onKeyDown={handleKeyPress}
          placeholder="描述您想要的界面..."
          autosize={{ minRows: 2, maxRows: 4 }}
          disabled={isLoading}
        />
        <div className="input-actions">
          <Button
            theme="primary"
            onClick={handleSend}
            loading={isLoading}
            disabled={!input.trim() || isLoading}
            style={{ width: '100%' }}
          >
            {isLoading ? '生成中...' : '发送'}
          </Button>
        </div>
      </div>


      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: white;
        }

        .chat-header {
          padding: 20px;
          background: white;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #fafafa;
        }

        .welcome-message {
          text-align: center;
          padding: 40px 20px;
        }

        .message {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          align-items: flex-start;
        }

        .user-message {
          flex-direction: row-reverse;
        }

        .message-content {
          flex: 1;
          padding: 12px 16px;
          border-radius: 8px;
          max-width: 70%;
        }

        .user-message .message-content {
          background: #0052d9;
          color: white;
        }

        .ai-message .message-content {
          background: white;
          border: 1px solid #e5e7eb;
        }

        .input-area {
          padding: 16px;
          background: white;
        }

        .input-actions {
          margin-top: 8px;
        }

        :global(.messages-container::-webkit-scrollbar) {
          width: 6px;
        }

        :global(.messages-container::-webkit-scrollbar-thumb) {
          background: #d0d0d0;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
