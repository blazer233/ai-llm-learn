import type { Data } from './+data';
import { useState } from 'react';
import { useData } from 'vike-react/useData';
import type { TodoItem } from '../../database/orm';
import {
  Card,
  Input,
  Button,
  Checkbox,
  Space,
  Statistic,
  Tag,
  MessagePlugin,
} from 'tdesign-react';
import { AddIcon, DeleteIcon } from 'tdesign-icons-react';
import 'tdesign-react/dist/tdesign.css';

export function TodoList() {
  const { todoItemsInitial } = useData<Data>();
  const [todoItems, setTodoItems] = useState<TodoItem[]>(todoItemsInitial);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const handleAddTodo = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!newTodo.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/todo/create', {
        method: 'POST',
        body: JSON.stringify({ text: newTodo }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const { data } = await response.json();
        setTodoItems((prev) => [...prev, data]);
        setNewTodo('');
        MessagePlugin.success('添加成功');
      }
    } catch (error) {
      console.error('Error adding todo:', error);
      MessagePlugin.error('添加失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      const response = await fetch('/api/todo/delete', {
        method: 'POST',
        body: JSON.stringify({ id }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setTodoItems((prev) => prev.filter((item) => item.id !== id));
        MessagePlugin.success('删除成功');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      MessagePlugin.error('删除失败');
    }
  };

  const handleToggleTodo = async (id: number, completed: boolean) => {
    try {
      const response = await fetch('/api/todo/toggle', {
        method: 'POST',
        body: JSON.stringify({ id, completed: !completed }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const { data } = await response.json();
        setTodoItems((prev) => prev.map((item) => (item.id === id ? data : item)));
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const handleUpdateTodo = async (id: number) => {
    if (!editText.trim()) return;

    try {
      const response = await fetch('/api/todo/update', {
        method: 'POST',
        body: JSON.stringify({ id, text: editText }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const { data } = await response.json();
        setTodoItems((prev) => prev.map((item) => (item.id === id ? data : item)));
        setEditingId(null);
        setEditText('');
        MessagePlugin.success('更新成功');
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      MessagePlugin.error('更新失败');
    }
  };

  const completedCount = todoItems.filter((item) => item.completed).length;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* 统计信息 */}
      <Card style={{ marginBottom: '24px' }} bordered>
        <Space size="large" align="center">
          <Statistic title="总计" value={todoItems.length} unit="项" />
          <Statistic
            title="已完成"
            value={completedCount}
            unit="项"
            style={{ color: '#00A870' }}
          />
          <Statistic
            title="未完成"
            value={todoItems.length - completedCount}
            unit="项"
            style={{ color: '#E34D59' }}
          />
        </Space>
      </Card>

      {/* 添加新 Todo 表单 */}
      <Card style={{ marginBottom: '24px' }} bordered>
        <form onSubmit={handleAddTodo}>
          <Space direction="horizontal" size="medium" style={{ width: '100%' }}>
            <Input
              value={newTodo}
              onChange={(value) => setNewTodo(value)}
              placeholder="输入新的待办事项..."
              disabled={loading}
              style={{ flex: 1 }}
              clearable
            />
            <Button
              type="submit"
              theme="primary"
              disabled={loading || !newTodo.trim()}
              icon={<AddIcon />}
              loading={loading}
            >
              {loading ? '添加中...' : '添加'}
            </Button>
          </Space>
        </form>
      </Card>

      {/* Todo 列表 */}
      <Card bordered>
        {todoItems.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#999',
            }}
          >
            <p style={{ fontSize: '16px', margin: 0 }}>
              暂无待办事项,开始添加一个吧!
            </p>
          </div>
        ) : (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {todoItems.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #e7e7e7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  backgroundColor: item.completed ? '#f8f9fa' : 'white',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                }}
              >
                <Checkbox
                  checked={item.completed}
                  onChange={(checked) => handleToggleTodo(item.id, item.completed)}
                />

                {editingId === item.id ? (
                  <Input
                    value={editText}
                    onChange={(value) => setEditText(value)}
                    onBlur={() => handleUpdateTodo(item.id)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter') handleUpdateTodo(item.id);
                      if (ev.key === 'Escape') {
                        setEditingId(null);
                        setEditText('');
                      }
                    }}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                ) : (
                  <span
                    onClick={() => {
                      setEditingId(item.id);
                      setEditText(item.text);
                    }}
                    style={{
                      flex: 1,
                      cursor: 'pointer',
                      textDecoration: item.completed ? 'line-through' : 'none',
                      color: item.completed ? '#999' : '#333',
                      fontSize: '15px',
                      userSelect: 'none',
                    }}
                  >
                    {item.text}
                  </span>
                )}

                {item.completed && (
                  <Tag theme="success" variant="light">
                    已完成
                  </Tag>
                )}

                <Button
                  onClick={() => handleDeleteTodo(item.id)}
                  theme="danger"
                  variant="text"
                  icon={<DeleteIcon />}
                  size="small"
                >
                  删除
                </Button>
              </div>
            ))}
          </Space>
        )}
      </Card>
    </div>
  );
}
