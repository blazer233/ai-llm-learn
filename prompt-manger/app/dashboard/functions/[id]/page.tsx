'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Button,
  Loading,
  Tag,
  MessagePlugin,
  Space,
  Divider,
  Collapse,
} from 'tdesign-react';
import { ArrowLeftIcon, EditIcon, CopyIcon, DeleteIcon } from 'tdesign-icons-react';
import DashboardLayout from '@/components/DashboardLayout';

const { Panel } = Collapse;

interface FunctionTemplate {
  id: string;
  name: string;
  code: string;
  description?: string;
  language: string;
  category?: string;
  tags?: string;
  params?: string;
  returnType?: string;
  examples?: string;
  scene?: {
    id: string;
    name: string;
    color?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function FunctionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [func, setFunc] = useState<FunctionTemplate | null>(null);

  const fetchFunction = async () => {
    try {
      const response = await fetch(`/api/functions/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFunc(data.function);
      } else {
        MessagePlugin.error('函数模板不存在');
        router.push('/dashboard/functions');
      }
    } catch (error) {
      console.error('Fetch function error:', error);
      MessagePlugin.error('获取函数模板失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchFunction();
    }
  }, [id]);

  const handleCopy = () => {
    if (func) {
      navigator.clipboard.writeText(func.code);
      MessagePlugin.success('代码已复制到剪贴板');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/functions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        MessagePlugin.success('删除成功');
        router.push('/dashboard/functions');
      } else {
        const data = await response.json();
        MessagePlugin.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete function error:', error);
      MessagePlugin.error('删除失败');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px' 
        }}>
          <Loading size="large" text="加载中..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!func) {
    return null;
  }

  const params_data = func.params ? JSON.parse(func.params) : [];
  const examples = func.examples ? JSON.parse(func.examples) : [];
  const tags = func.tags ? JSON.parse(func.tags) : [];

  return (
    <DashboardLayout>
      <div>
        <div style={{ marginBottom: '24px' }}>
          <Button
            variant="text"
            icon={<ArrowLeftIcon />}
            onClick={() => router.back()}
          >
            返回
          </Button>
        </div>

        <Card style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '16px'
          }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                marginBottom: '12px',
                fontFamily: 'monospace'
              }}>
                {func.name}
              </h1>
              {func.description && (
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                  {func.description}
                </p>
              )}
              <Space size="small">
                <Tag theme="success" variant="light">{func.language}</Tag>
                <Tag theme="primary" variant="light">{func.category}</Tag>
                {func.scene && (
                  <Tag theme="primary" style={{ background: func.scene.color }}>
                    {func.scene.name}
                  </Tag>
                )}
                {tags.map((tag: string, index: number) => (
                  <Tag key={index} variant="outline">{tag}</Tag>
                ))}
              </Space>
            </div>
            <Space>
              <Button
                variant="outline"
                icon={<CopyIcon />}
                onClick={handleCopy}
              >
                复制代码
              </Button>
              <Button
                variant="outline"
                icon={<EditIcon />}
                onClick={() => router.push(`/dashboard/functions?edit=${id}`)}
              >
                编辑
              </Button>
              <Button
                variant="outline"
                theme="danger"
                icon={<DeleteIcon />}
                onClick={handleDelete}
              >
                删除
              </Button>
            </Space>
          </div>

          <Divider />

          <div style={{ marginTop: '16px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(1, 1fr)', 
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>
                  返回类型
                </div>
                <code style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {func.returnType || 'void'}
                </code>
              </div>
            </div>
          </div>
        </Card>

        {params_data.length > 0 && (
          <Card style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              参数说明
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>参数名</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>类型</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>必填</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>说明</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>默认值</th>
                </tr>
              </thead>
              <tbody>
                {params_data.map((param: any, index: number) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{param.name}</td>
                    <td style={{ padding: '12px' }}>
                      <code style={{ fontSize: '13px', color: '#0052D9' }}>{param.type}</code>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {param.required ? (
                        <Tag size="small" theme="danger">必填</Tag>
                      ) : (
                        <Tag size="small" theme="default">可选</Tag>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: '#666' }}>{param.description || '-'}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
                      {param.defaultValue || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <Card style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            函数代码
          </h2>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '16px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: '1.6'
          }}>
            {func.code}
          </pre>
        </Card>

        {examples.length > 0 && (
          <Card style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              使用示例
            </h2>
            <Collapse defaultValue={['0']}>
              {examples.map((example: any, index: number) => (
                <Panel key={index} value={String(index)} header={example.title}>
                  {example.description && (
                    <p style={{ color: '#666', marginBottom: '12px' }}>{example.description}</p>
                  )}
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '16px', 
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '13px'
                  }}>
                    {example.code}
                  </pre>
                </Panel>
              ))}
            </Collapse>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
