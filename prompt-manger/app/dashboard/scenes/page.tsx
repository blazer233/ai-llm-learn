'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Button,
  Dialog,
  Form,
  Input,
  Textarea,
  MessagePlugin,
  Loading,
  Tag,
  Space,
} from 'tdesign-react';
import { AddIcon, FolderIcon, DeleteIcon, EditIcon } from 'tdesign-icons-react';
import DashboardLayout from '@/components/DashboardLayout';

const { FormItem } = Form;

interface Scene {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  _count?: {
    prompts: number;
  };
}

export default function ScenesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#0052D9',
  });

  const fetchScenes = async () => {
    try {
      const response = await fetch('/api/scenes');
      if (response.ok) {
        const data = await response.json();
        setScenes(data.scenes || []);
      }
    } catch (error) {
      console.error('Fetch scenes error:', error);
      MessagePlugin.error('获取场景列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenes();
  }, []);

  const handleCreate = () => {
    setEditingScene(null);
    setFormData({ name: '', description: '', color: '#0052D9' });
    setDialogVisible(true);
  };

  const handleEdit = (scene: Scene) => {
    setEditingScene(scene);
    setFormData({
      name: scene.name,
      description: scene.description || '',
      color: scene.color || '#0052D9',
    });
    setDialogVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      MessagePlugin.warning('请输入场景名称');
      return;
    }

    try {
      const url = editingScene
        ? `/api/scenes/${editingScene.id}`
        : '/api/scenes';
      const method = editingScene ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        MessagePlugin.success(editingScene ? '更新成功' : '创建成功');
        setDialogVisible(false);
        fetchScenes();
      } else {
        const data = await response.json();
        MessagePlugin.error(data.error || '操作失败');
      }
    } catch (error) {
      console.error('Submit scene error:', error);
      MessagePlugin.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/scenes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        MessagePlugin.success('删除成功');
        fetchScenes();
      } else {
        const data = await response.json();
        MessagePlugin.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete scene error:', error);
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

  return (
    <DashboardLayout>
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>场景管理</h1>
          <Button theme="primary" icon={<AddIcon />} onClick={handleCreate}>
            新建场景
          </Button>
        </div>

        {scenes.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <FolderIcon size="48px" style={{ marginBottom: '16px' }} />
              <p>暂无场景，点击右上角按钮创建</p>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {scenes.map((scene) => (
              <Card key={scene.id} style={{ cursor: 'pointer' }}>
                <div onClick={() => router.push(`/dashboard/prompts?sceneId=${scene.id}`)}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '12px' 
                  }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '8px', 
                      background: scene.color || '#0052D9', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: '#fff' 
                    }}>
                      <FolderIcon />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {scene.name}
                      </h3>
                      <Tag size="small" theme="default">
                        {scene._count?.prompts || 0} 个提示词
                      </Tag>
                    </div>
                  </div>
                  {scene.description && (
                    <p style={{ 
                      color: '#666', 
                      fontSize: '14px', 
                      marginBottom: '12px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {scene.description}
                    </p>
                  )}
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginTop: '12px', 
                  paddingTop: '12px', 
                  borderTop: '1px solid #f0f0f0' 
                }} onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="small"
                    variant="outline"
                    icon={<EditIcon />}
                    onClick={() => handleEdit(scene)}
                  >
                    编辑
                  </Button>
                  <Button
                    size="small"
                    variant="outline"
                    theme="danger"
                    icon={<DeleteIcon />}
                    onClick={() => handleDelete(scene.id)}
                  >
                    删除
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog
          header={editingScene ? '编辑场景' : '新建场景'}
          visible={dialogVisible}
          onClose={() => setDialogVisible(false)}
          onConfirm={handleSubmit}
          confirmBtn="保存"
          cancelBtn="取消"
        >
          <Form labelWidth={80}>
            <FormItem label="场景名称" required>
              <Input
                placeholder="请输入场景名称"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
              />
            </FormItem>
            <FormItem label="场景描述">
              <Textarea
                placeholder="请输入场景描述"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
              />
            </FormItem>
            <FormItem label="标签颜色">
              <Space>
                {['#0052D9', '#00A870', '#ED7B2F', '#E34D59', '#834EC2'].map((color) => (
                  <div
                    key={color}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '4px',
                      background: color,
                      cursor: 'pointer',
                      border: formData.color === color ? '3px solid #000' : 'none',
                    }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </Space>
            </FormItem>
          </Form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
