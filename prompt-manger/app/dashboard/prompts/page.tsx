'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  Button,
  Dialog,
  Form,
  Input,
  Textarea,
  Select,
  MessagePlugin,
  Loading,
  Tag,
  Table,
  Space,
  Row,
  Col,
} from 'tdesign-react';
import { AddIcon, FileIcon, DeleteIcon, EditIcon, ViewListIcon, FolderIcon, ChartLineIcon } from 'tdesign-icons-react';
import DashboardLayout from '@/components/DashboardLayout';

const { FormItem } = Form;

interface Prompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  tags?: string;
  model?: string;
  sceneId?: string;
  scene?: {
    name: string;
    color?: string;
  };
  createdAt: string;
  _count?: {
    testRecords: number;
  };
}

interface Scene {
  id: string;
  name: string;
}

export default function PromptsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sceneId = searchParams.get('sceneId');
  
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    description: '',
    tags: [] as string[],
    model: '',
    sceneId: sceneId || '',
  });

  const fetchPrompts = async () => {
    try {
      const url = sceneId ? `/api/prompts?sceneId=${sceneId}` : '/api/prompts';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.prompts || []);
      }
    } catch (error) {
      console.error('Fetch prompts error:', error);
      MessagePlugin.error('获取提示词列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchScenes = async () => {
    try {
      const response = await fetch('/api/scenes');
      if (response.ok) {
        const data = await response.json();
        setScenes(data.scenes || []);
      }
    } catch (error) {
      console.error('Fetch scenes error:', error);
    }
  };

  useEffect(() => {
    fetchPrompts();
    fetchScenes();
  }, [sceneId]);

  const handleCreate = () => {
    setEditingPrompt(null);
    setFormData({
      title: '',
      content: '',
      description: '',
      tags: [],
      model: 'qwen',
      sceneId: sceneId || '',
    });
    setDialogVisible(true);
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      title: prompt.title,
      content: prompt.content,
      description: prompt.description || '',
      tags: prompt.tags ? JSON.parse(prompt.tags) : [],
      model: prompt.model || 'qwen',
      sceneId: prompt.sceneId || '',
    });
    setDialogVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      MessagePlugin.warning('请填写标题和内容');
      return;
    }

    try {
      const url = editingPrompt
        ? `/api/prompts/${editingPrompt.id}`
        : '/api/prompts';
      const method = editingPrompt ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        MessagePlugin.success(editingPrompt ? '更新成功' : '创建成功');
        setDialogVisible(false);
        fetchPrompts();
      } else {
        const data = await response.json();
        MessagePlugin.error(data.error || '操作失败');
      }
    } catch (error) {
      console.error('Submit prompt error:', error);
      MessagePlugin.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        MessagePlugin.success('删除成功');
        fetchPrompts();
      } else {
        const data = await response.json();
        MessagePlugin.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete prompt error:', error);
      MessagePlugin.error('删除失败');
    }
  };

  const columns = [
    {
      colKey: 'title',
      title: '标题',
      width: 200,
      cell: ({ row }: { row: Prompt }) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{row.title}</div>
          {row.description && (
            <div style={{ fontSize: '12px', color: '#999' }}>{row.description}</div>
          )}
        </div>
      ),
    },
    {
      colKey: 'scene',
      title: '场景',
      width: 120,
      cell: ({ row }: { row: Prompt }) =>
        row.scene ? (
          <Tag theme="primary" style={{ background: row.scene.color }}>
            {row.scene.name}
          </Tag>
        ) : (
          <span style={{ color: '#999' }}>未分类</span>
        ),
    },
    {
      colKey: 'model',
      title: '推荐模型',
      width: 120,
      cell: ({ row }: { row: Prompt }) => row.model || '-',
    },
    {
      colKey: 'tags',
      title: '标签',
      width: 200,
      cell: ({ row }: { row: Prompt }) => {
        const tags = row.tags ? JSON.parse(row.tags) : [];
        return (
          <Space size="small">
            {tags.map((tag: string, index: number) => (
              <Tag key={index} size="small">
                {tag}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      colKey: 'stats',
      title: '统计',
      width: 150,
      cell: ({ row }: { row: Prompt }) => (
        <Tag size="small" theme="warning">
          测试 {row._count?.testRecords || 0}
        </Tag>
      ),
    },
    {
      colKey: 'actions',
      title: '操作',
      width: 200,
      cell: ({ row }: { row: Prompt }) => (
        <Space size="small">
          <Button
            size="small"
            variant="outline"
            icon={<ViewListIcon />}
            onClick={() => router.push(`/dashboard/prompts/${row.id}`)}
          >
            详情
          </Button>
          <Button
            size="small"
            variant="outline"
            icon={<EditIcon />}
            onClick={() => handleEdit(row)}
          >
            编辑
          </Button>
          <Button
            size="small"
            variant="outline"
            theme="danger"
            icon={<DeleteIcon />}
            onClick={() => handleDelete(row.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

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

  const stats = {
    totalPrompts: prompts.length,
    totalScenes: scenes.length,
    totalTests: prompts.reduce((sum, p) => sum + (p._count?.testRecords || 0), 0),
  };

  return (
    <DashboardLayout>
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>提示词库</h1>
          <Button theme="primary" icon={<AddIcon />} onClick={handleCreate}>
            新建提示词
          </Button>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={4}>
            <Card style={{ textAlign: 'center' }}>
              <div style={{ 
                color: '#0052D9', 
                fontSize: '32px', 
                marginBottom: '12px' 
              }}>
                <FileIcon />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                {stats.totalPrompts}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                提示词总数
              </div>
            </Card>
          </Col>

          <Col span={4}>
            <Card style={{ textAlign: 'center' }}>
              <div style={{ 
                color: '#00A870', 
                fontSize: '32px', 
                marginBottom: '12px' 
              }}>
                <FolderIcon />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                {stats.totalScenes}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                场景总数
              </div>
            </Card>
          </Col>

          <Col span={4}>
            <Card style={{ textAlign: 'center' }}>
              <div style={{ 
                color: '#ED7B2F', 
                fontSize: '32px', 
                marginBottom: '12px' 
              }}>
                <ChartLineIcon />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                {stats.totalTests}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                测试记录
              </div>
            </Card>
          </Col>
        </Row>

        {prompts.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <FileIcon size="48px" style={{ marginBottom: '16px' }} />
              <p>暂无提示词，点击右上角按钮创建</p>
            </div>
          </Card>
        ) : (
          <Card>
            <Table
              data={prompts}
              columns={columns}
              rowKey="id"
              stripe
              hover
            />
          </Card>
        )}

        <Dialog
          header={editingPrompt ? '编辑提示词' : '新建提示词'}
          visible={dialogVisible}
          onClose={() => setDialogVisible(false)}
          onConfirm={handleSubmit}
          confirmBtn="保存"
          cancelBtn="取消"
          width="800px"
        >
          <Form labelWidth={80}>
            <FormItem label="标题" required>
              <Input
                placeholder="请输入提示词标题"
                value={formData.title}
                onChange={(value) => setFormData({ ...formData, title: value })}
              />
            </FormItem>
            <FormItem label="内容" required>
              <Textarea
                placeholder="请输入提示词内容"
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                autosize={{ minRows: 6, maxRows: 12 }}
              />
            </FormItem>
            <FormItem label="描述">
              <Textarea
                placeholder="请输入提示词描述"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
              />
            </FormItem>
            <FormItem label="所属场景">
              <Select
                placeholder="请选择场景"
                value={formData.sceneId}
                onChange={(value) => setFormData({ ...formData, sceneId: value as string })}
                clearable
              >
                {scenes.map((scene) => (
                  <Select.Option key={scene.id} value={scene.id} label={scene.name} />
                ))}
              </Select>
            </FormItem>
            <FormItem label="推荐模型">
              <Select
                placeholder="请选择推荐使用的模型"
                value={formData.model}
                onChange={(value) => setFormData({ ...formData, model: value as string })}
              >
                <Select.Option value="qwen" label="通义千问 (Qwen)" />
                <Select.Option value="hunyuan" label="腾讯混元 (Hunyuan)" />
                <Select.Option value="deepseek" label="DeepSeek" />
                <Select.Option value="gemini" label="Google Gemini" />
              </Select>
            </FormItem>
          </Form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
