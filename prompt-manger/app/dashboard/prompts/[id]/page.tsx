'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Button,
  Tabs,
  Loading,
  MessagePlugin,
  Space,
  Tag,
  Timeline,
  Form,
  Select,
  Textarea,
  Input,
  Drawer,
  Divider,
} from 'tdesign-react';
import { ArrowLeftIcon, PlayIcon, LockOnIcon, SettingIcon, CheckCircleIcon, DeleteIcon } from 'tdesign-icons-react';
import DashboardLayout from '@/components/DashboardLayout';

const { TabPanel } = Tabs;
const { FormItem } = Form;

// 格式化日期时间的辅助函数
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

interface Prompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  tags?: string[];
  model?: string;
  scene?: {
    name: string;
    color?: string;
  };
  testRecords: {
    id: string;
    model: string;
    input: string;
    output: string;
    rating?: number;
    createdAt: string;
  }[];
}

export default function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testForm, setTestForm] = useState({
    model: 'qwen',
    modelVersion: '',
    input: '',
    apiKey: '',
  });
  const [testResult, setTestResult] = useState<string>('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [apiKeyForm, setApiKeyForm] = useState({
    qwen: '',
    hunyuan: '',
    deepseek: '',
    gemini: '',
  });

  // API Key 管理
  const getStorageKey = (model: string) => {
    return `${model}_api_key`;
  };

  const loadApiKey = (model: string) => {
    try {
      const storageKey = getStorageKey(model);
      const savedKey = localStorage.getItem(storageKey);
      return savedKey || '';
    } catch (error) {
      console.error('Load API key error:', error);
      return '';
    }
  };

  const saveApiKey = (model: string, apiKey: string) => {
    try {
      const storageKey = getStorageKey(model);
      if (apiKey) {
        localStorage.setItem(storageKey, apiKey);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Save API key error:', error);
    }
  };

  const fetchPrompt = async () => {
    try {
      const response = await fetch(`/api/prompts/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setPrompt(data.prompt);
        const defaultModel = data.prompt.model || 'qwen';
        setTestForm({
          ...testForm,
          model: defaultModel,
          modelVersion: '',
          apiKey: loadApiKey(defaultModel),
        });
      } else {
        MessagePlugin.error('获取提示词失败');
        router.push('/dashboard/prompts');
      }
    } catch (error) {
      console.error('Fetch prompt error:', error);
      MessagePlugin.error('获取提示词失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompt();
    // 加载已保存的 API Keys
    setApiKeyForm({
      openai: loadApiKey('qwen'),
      claude: loadApiKey('hunyuan'),
    });
  }, [resolvedParams.id]);

  const handleSaveApiKey = (model: 'qwen' | 'hunyuan' | 'deepseek' | 'gemini') => {
    try {
      const storageKey = `${model}_api_key`;
      const value = apiKeyForm[model];
      if (value) {
        localStorage.setItem(storageKey, value);
        MessagePlugin.success(`${model.charAt(0).toUpperCase() + model.slice(1)} API Key 已保存`);
      } else {
        localStorage.removeItem(storageKey);
        MessagePlugin.success(`${model.charAt(0).toUpperCase() + model.slice(1)} API Key 已删除`);
      }
    } catch (error) {
      console.error('Save API key error:', error);
      MessagePlugin.error('保存失败');
    }
  };

  const handleDeleteApiKey = (model: 'qwen' | 'hunyuan' | 'deepseek' | 'gemini') => {
    try {
      const storageKey = `${model}_api_key`;
      localStorage.removeItem(storageKey);
      setApiKeyForm({ ...apiKeyForm, [model]: '' });
      MessagePlugin.success('API Key 已删除');
    } catch (error) {
      console.error('Delete API key error:', error);
      MessagePlugin.error('删除失败');
    }
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '***';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  const handleTest = async () => {
    if (!testForm.input) {
      MessagePlugin.warning('请输入测试内容');
      return;
    }

    if (!testForm.apiKey) {
      MessagePlugin.warning('请输入 API Key');
      return;
    }

    if (!testForm.modelVersion) {
      MessagePlugin.warning('请输入模型版本');
      return;
    }

    if (!prompt) {
      MessagePlugin.error('提示词数据不存在');
      return;
    }

    setTestLoading(true);
    setTestResult('');

    try {
      // 保存 API Key 到 localStorage
      saveApiKey(testForm.model, testForm.apiKey);
      
      // 调用真实的 AI API
      const response = await fetch('/api/prompts/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: testForm.model,
          modelVersion: testForm.modelVersion,
          apiKey: testForm.apiKey,
          prompt: prompt.content,
          input: testForm.input,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '测试失败');
      }

      setTestResult(data.output);
      MessagePlugin.success('测试完成，API Key 已保存');
    } catch (error) {
      console.error('Test prompt error:', error);
      const errorMessage = error instanceof Error ? error.message : '测试失败';
      MessagePlugin.error(errorMessage);
      setTestResult(`错误：${errorMessage}`);
    } finally {
      setTestLoading(false);
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

  if (!prompt) {
    return null;
  }

  return (
    <DashboardLayout>
      <div>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="text"
            icon={<ArrowLeftIcon />}
            onClick={() => router.back()}
          >
            返回
          </Button>
          <Button
            variant="outline"
            icon={<SettingIcon />}
            onClick={() => setDrawerVisible(true)}
          >
            API Key 管理
          </Button>
        </div>

        <Card style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start' 
          }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
                {prompt.title}
              </h1>
              {prompt.description && (
                <p style={{ color: '#666', marginBottom: '12px' }}>
                  {prompt.description}
                </p>
              )}
              <Space size="small">
                {prompt.scene && (
                  <Tag theme="primary" style={{ background: prompt.scene.color }}>
                    {prompt.scene.name}
                  </Tag>
                )}
                {prompt.model && <Tag>模型: {prompt.model}</Tag>}
                {prompt.tags && prompt.tags.map((tag, index) => (
                  <Tag key={index} size="small">
                    {tag}
                  </Tag>
                ))}
              </Space>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="content">
          <TabPanel value="content" label="提示词内容">
            <Card>
              <div style={{ 
                height: 'calc(100vh - 360px)',
                overflowY: 'auto',
                overflowX: 'hidden',
              }}>
                <div style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'monospace', 
                  background: '#f5f7fa', 
                  padding: '16px', 
                  borderRadius: '4px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                }}>
                  {prompt.content}
                </div>
              </div>
            </Card>
          </TabPanel>

          <TabPanel value="test" label="在线测试">
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px',
            }}>
              <Card title="测试配置">
                <div style={{ 
                  height: 'calc(100vh - 400px)',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                }}>
                  <Form labelWidth={100}>
                    <FormItem label="选择模型">
                      <Select
                        value={testForm.model}
                        onChange={(value) => {
                          const newModel = value as string;
                          setTestForm({ 
                            ...testForm, 
                            model: newModel,
                            apiKey: loadApiKey(newModel),
                          });
                        }}
                      >
                        <Select.Option value="qwen" label="通义千问 (Qwen)" />
                        <Select.Option value="hunyuan" label="腾讯混元 (Hunyuan)" />
                        <Select.Option value="deepseek" label="DeepSeek" />
                        <Select.Option value="gemini" label="Google Gemini" />
                      </Select>
                    </FormItem>
                    <FormItem label="模型版本" required>
                      <Input
                        placeholder="如：qwen-turbo, hunyuan-lite, deepseek-chat, gemini-pro"
                        value={testForm.modelVersion}
                        onChange={(value) => setTestForm({ ...testForm, modelVersion: value })}
                      />
                    </FormItem>
                    <FormItem label="API Key" required>
                      <Input
                        type="password"
                        placeholder={`请输入 ${testForm.model.charAt(0).toUpperCase() + testForm.model.slice(1)} API Key`}
                        value={testForm.apiKey}
                        onChange={(value) => setTestForm({ ...testForm, apiKey: value })}
                        prefixIcon={<LockOnIcon />}
                        tips={testForm.apiKey ? '已保存的 API Key' : '输入后将保存到浏览器本地'}
                      />
                    </FormItem>
                    <FormItem label="测试内容">
                      <Textarea
                        placeholder="请输入测试内容"
                        value={testForm.input}
                        onChange={(value) => setTestForm({ ...testForm, input: value })}
                        autosize={{ minRows: 8, maxRows: 20 }}
                      />
                    </FormItem>
                    <FormItem>
                      <Button
                        theme="primary"
                        icon={<PlayIcon />}
                        onClick={handleTest}
                        loading={testLoading}
                        block
                      >
                        开始测试
                      </Button>
                    </FormItem>
                  </Form>
                </div>
              </Card>

              <Card title="测试结果">
                <div style={{ 
                  height: 'calc(100vh - 400px)',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                }}>
                  {testLoading ? (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      height: '100%',
                      minHeight: '400px',
                    }}>
                      <Loading text="AI 生成中..." />
                    </div>
                  ) : testResult ? (
                    <div style={{ 
                      whiteSpace: 'pre-wrap', 
                      fontFamily: 'monospace', 
                      background: '#f5f7fa', 
                      padding: '16px', 
                      borderRadius: '4px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                    }}>
                      {testResult}
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      minHeight: '400px',
                      color: '#999',
                    }}>
                      <PlayIcon size="48px" style={{ marginBottom: '16px' }} />
                      <p>点击"开始测试"查看结果</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabPanel>

          <TabPanel value="tests" label={`测试记录 (${prompt.testRecords?.length || 0})`}>
            <Card>
              <div style={{ 
                height: 'calc(100vh - 360px)',
                overflowY: 'auto',
                overflowX: 'hidden',
              }}>
                {prompt.testRecords && prompt.testRecords.length > 0 ? (
                  <Timeline>
                    {prompt.testRecords.map((record) => (
                      <Timeline.Item key={record.id} label={formatDateTime(record.createdAt)}>
                        <div style={{ marginBottom: '8px' }}>
                          <Tag>{record.model}</Tag>
                          {record.rating && (
                            <span style={{ marginLeft: '8px' }}>
                              {'⭐'.repeat(record.rating)}
                            </span>
                          )}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <strong>输入：</strong>
                          <div style={{ 
                            background: '#f5f7fa', 
                            padding: '8px', 
                            borderRadius: '4px',
                            marginTop: '4px',
                            fontSize: '14px',
                          }}>
                            {record.input}
                          </div>
                        </div>
                        <div>
                          <strong>输出：</strong>
                          <div style={{ 
                            background: '#f5f7fa', 
                            padding: '8px', 
                            borderRadius: '4px',
                            marginTop: '4px',
                            fontSize: '14px',
                          }}>
                            {record.output}
                          </div>
                        </div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                ) : (
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    minHeight: '400px',
                    color: '#999',
                  }}>
                    <p>暂无测试记录</p>
                  </div>
                )}
              </div>
            </Card>
          </TabPanel>
        </Tabs>

        <Drawer
          header="API Key 管理"
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          size="large"
        >
          <div>
            <div style={{ marginBottom: '16px', color: '#666' }}>
              <p>在这里配置各个 AI 模型的 API Key。这些密钥将安全地保存在您的浏览器本地存储中。</p>
            </div>

            <Divider />

            <Form labelWidth={150}>
              <div style={{ marginBottom: '24px' }}>
                <FormItem label="通义千问 API Key">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <Input
                          type="password"
                          placeholder="请输入通义千问 API Key"
                          value={apiKeyForm.qwen}
                          onChange={(value) => setApiKeyForm({ ...apiKeyForm, qwen: value })}
                          prefixIcon={<LockOnIcon />}
                        />
                      </div>
                      <Button
                        theme="primary"
                        onClick={() => handleSaveApiKey('qwen')}
                        icon={<CheckCircleIcon />}
                      >
                        保存
                      </Button>
                      <Button
                        theme="danger"
                        variant="outline"
                        onClick={() => handleDeleteApiKey('qwen')}
                        disabled={!apiKeyForm.qwen}
                        icon={<DeleteIcon />}
                      >
                        删除
                      </Button>
                    </div>
                    {apiKeyForm.qwen && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        当前密钥: {maskApiKey(apiKeyForm.qwen)}
                      </div>
                    )}
                  </Space>
                </FormItem>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <FormItem label="腾讯混元 API Key">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <Input
                          type="password"
                          placeholder="请输入腾讯混元 API Key"
                          value={apiKeyForm.hunyuan}
                          onChange={(value) => setApiKeyForm({ ...apiKeyForm, hunyuan: value })}
                          prefixIcon={<LockOnIcon />}
                        />
                      </div>
                      <Button
                        theme="primary"
                        onClick={() => handleSaveApiKey('hunyuan')}
                        icon={<CheckCircleIcon />}
                      >
                        保存
                      </Button>
                      <Button
                        theme="danger"
                        variant="outline"
                        onClick={() => handleDeleteApiKey('hunyuan')}
                        disabled={!apiKeyForm.hunyuan}
                        icon={<DeleteIcon />}
                      >
                        删除
                      </Button>
                    </div>
                    {apiKeyForm.hunyuan && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        当前密钥: {maskApiKey(apiKeyForm.hunyuan)}
                      </div>
                    )}
                  </Space>
                </FormItem>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <FormItem label="DeepSeek API Key">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <Input
                          type="password"
                          placeholder="请输入 DeepSeek API Key"
                          value={apiKeyForm.deepseek}
                          onChange={(value) => setApiKeyForm({ ...apiKeyForm, deepseek: value })}
                          prefixIcon={<LockOnIcon />}
                        />
                      </div>
                      <Button
                        theme="primary"
                        onClick={() => handleSaveApiKey('deepseek')}
                        icon={<CheckCircleIcon />}
                      >
                        保存
                      </Button>
                      <Button
                        theme="danger"
                        variant="outline"
                        onClick={() => handleDeleteApiKey('deepseek')}
                        disabled={!apiKeyForm.deepseek}
                        icon={<DeleteIcon />}
                      >
                        删除
                      </Button>
                    </div>
                    {apiKeyForm.deepseek && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        当前密钥: {maskApiKey(apiKeyForm.deepseek)}
                      </div>
                    )}
                  </Space>
                </FormItem>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <FormItem label="Google Gemini API Key">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <Input
                          type="password"
                          placeholder="请输入 Google Gemini API Key"
                          value={apiKeyForm.gemini}
                          onChange={(value) => setApiKeyForm({ ...apiKeyForm, gemini: value })}
                          prefixIcon={<LockOnIcon />}
                        />
                      </div>
                      <Button
                        theme="primary"
                        onClick={() => handleSaveApiKey('gemini')}
                        icon={<CheckCircleIcon />}
                      >
                        保存
                      </Button>
                      <Button
                        theme="danger"
                        variant="outline"
                        onClick={() => handleDeleteApiKey('gemini')}
                        disabled={!apiKeyForm.gemini}
                        icon={<DeleteIcon />}
                      >
                        删除
                      </Button>
                    </div>
                    {apiKeyForm.gemini && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        当前密钥: {maskApiKey(apiKeyForm.gemini)}
                      </div>
                    )}
                  </Space>
                </FormItem>
              </div>
            </Form>

            <Divider />

            <div style={{ fontSize: '12px', color: '#999', lineHeight: '1.6' }}>
              <p>💡 提示：</p>
              <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                <li>API Key 仅保存在您的浏览器本地，不会上传到服务器</li>
                <li>切换浏览器或清除浏览器数据后需要重新配置</li>
                <li>在线测试功能会自动读取这里保存的 API Key</li>
              </ul>
            </div>

            <Divider />

            <div style={{ lineHeight: '1.8' }}>
              <div style={{ marginBottom: '16px' }}>
                <strong>通义千问 (Qwen):</strong>
                <br />
                <a 
                  href="https://dashscope.console.aliyun.com/apiKey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#0052d9' }}
                >
                  https://dashscope.console.aliyun.com/apiKey
                </a>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>腾讯混元 (Hunyuan):</strong>
                <br />
                <a 
                  href="https://cloud.tencent.com/product/hunyuan" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#0052d9' }}
                >
                  https://cloud.tencent.com/product/hunyuan
                </a>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>DeepSeek:</strong>
                <br />
                <a 
                  href="https://platform.deepseek.com/api_keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#0052d9' }}
                >
                  https://platform.deepseek.com/api_keys
                </a>
              </div>
              <div>
                <strong>Google Gemini:</strong>
                <br />
                <a 
                  href="https://makersuite.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#0052d9' }}
                >
                  https://makersuite.google.com/app/apikey
                </a>
              </div>
            </div>
          </div>
        </Drawer>
      </div>
    </DashboardLayout>
  );
}
