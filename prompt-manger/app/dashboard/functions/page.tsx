'use client';

import { useEffect, useState, useCallback } from 'react';
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
import {
  AddIcon,
  CodeIcon,
  DeleteIcon,
  EditIcon,
  ViewListIcon,
  FolderIcon,
  CopyIcon,
} from 'tdesign-icons-react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import { safeJSONParse, copyToClipboard } from '@/lib/utils';
import { LANGUAGES, CATEGORIES } from '@/lib/constants';

const { FormItem } = Form;

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
  sceneId?: string;
  scene?: {
    name: string;
    color?: string;
  };
  createdAt: string;
}

interface Scene {
  id: string;
  name: string;
}

export default function FunctionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sceneId = searchParams.get('sceneId');
  
  const [loading, setLoading] = useState(true);
  const [functions, setFunctions] = useState<FunctionTemplate[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingFunction, setEditingFunction] = useState<FunctionTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    language: 'typescript',
    category: 'utility',
    tags: [] as string[],
    returnType: '',
    sceneId: sceneId || '',
  });

  const fetchFunctions = async () => {
    try {
      const params = new URLSearchParams();
      if (sceneId) params.append('sceneId', sceneId);
      
      const url = `/api/functions${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setFunctions(data.functions || []);
      }
    } catch (error) {
      console.error('Fetch functions error:', error);
      MessagePlugin.error('获取函数模板列表失败');
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
    fetchFunctions();
    fetchScenes();
  }, [sceneId]);

  const handleCreate = () => {
    setEditingFunction(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      language: 'typescript',
      category: 'utility',
      tags: [],
      returnType: '',
      sceneId: sceneId || '',
    });
    setDialogVisible(true);
  };

  const handleEdit = useCallback((func: FunctionTemplate) => {
    setEditingFunction(func);
    setFormData({
      name: func.name || '',
      code: func.code || '',
      description: func.description || '',
      language: func.language || 'typescript',
      category: func.category || 'utility',
      tags: safeJSONParse(func.tags, []),
      returnType: func.returnType || '',
      sceneId: func.sceneId || '',
    });
    setTimeout(() => setDialogVisible(true), 0);
  }, []);

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) {
      MessagePlugin.warning('请填写函数名称和代码');
      return;
    }

    try {
      const url = editingFunction
        ? `/api/functions/${editingFunction.id}`
        : '/api/functions';
      const method = editingFunction ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        MessagePlugin.success(editingFunction ? '更新成功' : '创建成功');
        setDialogVisible(false);
        fetchFunctions();
      } else {
        const data = await response.json();
        MessagePlugin.error(data.error || '操作失败');
      }
    } catch (error) {
      console.error('Submit function error:', error);
      MessagePlugin.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/functions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        MessagePlugin.success('删除成功');
        fetchFunctions();
      } else {
        const data = await response.json();
        MessagePlugin.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete function error:', error);
      MessagePlugin.error('删除失败');
    }
  };

  const handleCopy = useCallback(async (func: FunctionTemplate) => {
    const success = await copyToClipboard(func.code);
    if (success) {
      MessagePlugin.success('代码已复制到剪贴板');
    } else {
      MessagePlugin.error('复制失败，请手动复制');
    }
  }, []);

  const columns = [
    {
      colKey: 'name',
      title: '函数名称',
      width: 200,
      cell: ({ row }: { row: FunctionTemplate }) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', fontFamily: 'monospace' }}>
            {row.name}
          </div>
          {row.description && (
            <div style={{ fontSize: '12px', color: '#999' }}>{row.description}</div>
          )}
        </div>
      ),
    },
    {
      colKey: 'language',
      title: '语言',
      width: 100,
      cell: ({ row }: { row: FunctionTemplate }) => (
        <Tag theme="success" variant="light">
          {row.language}
        </Tag>
      ),
    },
    {
      colKey: 'category',
      title: '分类',
      width: 100,
      cell: ({ row }: { row: FunctionTemplate }) => (
        <Tag theme="primary" variant="light">
          {CATEGORIES.find(c => c.value === row.category)?.label || row.category}
        </Tag>
      ),
    },
    {
      colKey: 'scene',
      title: '场景',
      width: 120,
      cell: ({ row }: { row: FunctionTemplate }) =>
        row.scene ? (
          <Tag theme="primary" style={{ background: row.scene.color }}>
            {row.scene.name}
          </Tag>
        ) : (
          <span style={{ color: '#999' }}>未分类</span>
        ),
    },
    {
      colKey: 'returnType',
      title: '返回类型',
      width: 120,
      cell: ({ row }: { row: FunctionTemplate }) => (
        <code style={{ fontSize: '12px', color: '#666' }}>
          {row.returnType || 'void'}
        </code>
      ),
    },
    {
      colKey: 'actions',
      title: '操作',
      width: 280,
      cell: ({ row }: { row: FunctionTemplate }) => (
        <Space size="small">
          <Button
            size="small"
            variant="outline"
            icon={<ViewListIcon />}
            onClick={() => router.push(`/dashboard/functions/${row.id}`)}
          >
            详情
          </Button>
          <Button
            size="small"
            variant="outline"
            icon={<CopyIcon />}
            onClick={() => handleCopy(row)}
          >
            复制代码
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
    totalFunctions: functions.length,
    totalScenes: scenes.length,
  };

  return (
    <DashboardLayout>
      <div>
        <PageHeader
          title="函数模板库"
          action={{ label: '新建函数模板', icon: <AddIcon />, onClick: handleCreate }}
        />

        <Row gutter={12} style={{ marginBottom: '20px' }}>
          <Col flex="1">
            <StatCard icon={<CodeIcon />} value={functions.length} label="函数总数" />
          </Col>
          <Col flex="1">
            <StatCard
              icon={<FolderIcon />}
              value={scenes.length}
              label="场景总数"
              iconColor="#00A870"
            />
          </Col>
        </Row>

        {functions.length === 0 ? (
          <EmptyState icon={<CodeIcon />} message="暂无函数模板，点击右上角按钮创建" />
        ) : (
          <Card>
            <Table
              data={functions}
              columns={columns}
              rowKey="id"
              stripe
              hover
            />
          </Card>
        )}

        <Dialog
          key={editingFunction ? editingFunction.id : 'new'}
          header={editingFunction ? '编辑函数模板' : '新建函数模板'}
          visible={dialogVisible}
          onClose={() => setDialogVisible(false)}
          onConfirm={handleSubmit}
          confirmBtn="保存"
          cancelBtn="取消"
          width="900px"
          destroyOnClose
        >
          <Form labelWidth={100} data={formData}>
            <FormItem label="函数名称" name="name">
              <Input
                placeholder="请输入函数名称（如：formatDate）"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
              />
            </FormItem>
            
            <Row gutter={16}>
              <Col span={6}>
                <FormItem label="编程语言" name="language">
                  <Select
                    value={formData.language}
                    onChange={(value) => setFormData({ ...formData, language: value as string })}
                  >
                    {LANGUAGES.map((lang) => (
                      <Select.Option key={lang.value} value={lang.value} label={lang.label} />
                    ))}
                  </Select>
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem label="分类" name="category">
                  <Select
                    value={formData.category}
                    onChange={(value) => setFormData({ ...formData, category: value as string })}
                  >
                    {CATEGORIES.map((cat) => (
                      <Select.Option key={cat.value} value={cat.value} label={cat.label} />
                    ))}
                  </Select>
                </FormItem>
              </Col>
            </Row>

            <FormItem label="函数代码" name="code">
              <Textarea
                placeholder="请输入函数代码"
                value={formData.code}
                onChange={(value) => setFormData({ ...formData, code: value })}
                autosize={{ minRows: 12, maxRows: 20 }}
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
              />
            </FormItem>
            
            <FormItem label="返回类型" name="returnType">
              <Input
                placeholder="如：string | number | Promise<User>"
                value={formData.returnType}
                onChange={(value) => setFormData({ ...formData, returnType: value })}
              />
            </FormItem>

            <FormItem label="函数描述" name="description">
              <Textarea
                placeholder="请输入函数描述和用途说明"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                autosize={{ minRows: 3, maxRows: 6 }}
              />
            </FormItem>

            <FormItem label="所属场景" name="sceneId">
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
          </Form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
