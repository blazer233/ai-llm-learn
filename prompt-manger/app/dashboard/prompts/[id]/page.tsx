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
import {
  ArrowLeftIcon,
  PlayIcon,
  LockOnIcon,
  SettingIcon,
  CheckCircleIcon,
  DeleteIcon,
} from 'tdesign-icons-react';
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
    input: '',
  });
  const [testResult, setTestResult] = useState<string>('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [apiKeyForm, setApiKeyForm] = useState({
    qwen: { apiKey: '', modelVersion: '' },
    hunyuan: { apiKey: '', modelVersion: '' },
    deepseek: { apiKey: '', modelVersion: '' },
    ollama: { baseUrl: '', modelVersion: '' },
  });
  const [tokenUsage, setTokenUsage] = useState<{
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null>(null);

  // API Key 和模型版本管理
  const getStorageKey = (model: string, type: 'apiKey' | 'modelVersion' | 'baseUrl') => {
    return `${model}_${type}`;
  };

  const loadConfig = (model: string) => {
    try {
      if (model === 'ollama') {
        const baseUrl = localStorage.getItem(getStorageKey(model, 'baseUrl')) || '';
        const modelVersion =
          localStorage.getItem(getStorageKey(model, 'modelVersion')) || '';
        return { baseUrl, modelVersion };
      }
      
      const apiKey = localStorage.getItem(getStorageKey(model, 'apiKey')) || '';
      const modelVersion =
        localStorage.getItem(getStorageKey(model, 'modelVersion')) || '';
      return { apiKey, modelVersion };
    } catch (error) {
      console.error('Load config error:', error);
      return { apiKey: '', modelVersion: '', baseUrl: '' };
    }
  };

  const saveConfig = (model: string, config: { apiKey?: string; modelVersion?: string; baseUrl?: string }) => {
    try {
      if (model === 'ollama') {
        if (config.baseUrl) {
          localStorage.setItem(getStorageKey(model, 'baseUrl'), config.baseUrl);
        } else {
          localStorage.removeItem(getStorageKey(model, 'baseUrl'));
        }
      } else {
        if (config.apiKey) {
          localStorage.setItem(getStorageKey(model, 'apiKey'), config.apiKey);
        } else {
          localStorage.removeItem(getStorageKey(model, 'apiKey'));
        }
      }
      
      if (config.modelVersion) {
        localStorage.setItem(
          getStorageKey(model, 'modelVersion'),
          config.modelVersion
        );
      } else {
        localStorage.removeItem(getStorageKey(model, 'modelVersion'));
      }
    } catch (error) {
      console.error('Save config error:', error);
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
          model: defaultModel,
          input: '',
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
    // 加载已保存的配置
    setApiKeyForm({
      qwen: loadConfig('qwen') as { apiKey: string; modelVersion: string },
      hunyuan: loadConfig('hunyuan') as { apiKey: string; modelVersion: string },
      deepseek: loadConfig('deepseek') as { apiKey: string; modelVersion: string },
      ollama: loadConfig('ollama') as { baseUrl: string; modelVersion: string },
    });
  }, [resolvedParams.id]);

  const handleSaveApiKey = (
    model: 'qwen' | 'hunyuan' | 'deepseek' | 'ollama'
  ) => {
    try {
      const config = apiKeyForm[model];
      if (model === 'ollama') {
        saveConfig(model, { 
          baseUrl: (config as { baseUrl: string; modelVersion: string }).baseUrl, 
          modelVersion: config.modelVersion 
        });
      } else {
        saveConfig(model, { 
          apiKey: (config as { apiKey: string; modelVersion: string }).apiKey, 
          modelVersion: config.modelVersion 
        });
      }
      MessagePlugin.success(
        `${model.charAt(0).toUpperCase() + model.slice(1)} 配置已保存`
      );
    } catch (error) {
      console.error('Save config error:', error);
      MessagePlugin.error('保存失败');
    }
  };

  const handleDeleteApiKey = (
    model: 'qwen' | 'hunyuan' | 'deepseek' | 'ollama'
  ) => {
    try {
      if (model === 'ollama') {
        localStorage.removeItem(getStorageKey(model, 'baseUrl'));
      } else {
        localStorage.removeItem(getStorageKey(model, 'apiKey'));
      }
      localStorage.removeItem(getStorageKey(model, 'modelVersion'));
      
      if (model === 'ollama') {
        setApiKeyForm({
          ...apiKeyForm,
          [model]: { baseUrl: '', modelVersion: '' },
        });
      } else {
        setApiKeyForm({
          ...apiKeyForm,
          [model]: { apiKey: '', modelVersion: '' },
        });
      }
      MessagePlugin.success('配置已删除');
    } catch (error) {
      console.error('Delete config error:', error);
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

    const config = loadConfig(testForm.model);

    if (testForm.model === 'ollama') {
      if (!(config as { baseUrl?: string }).baseUrl) {
        MessagePlugin.warning('请先在 API Key 管理中配置 Ollama 的 Base URL');
        return;
      }
      if (!config.modelVersion) {
        MessagePlugin.warning('请先在 API Key 管理中配置 Ollama 的模型版本');
        return;
      }
    } else {
      if (!(config as { apiKey?: string }).apiKey) {
        MessagePlugin.warning('请先在 API Key 管理中配置该模型的 API Key');
        return;
      }
      if (!config.modelVersion) {
        MessagePlugin.warning('请先在 API Key 管理中配置该模型的版本');
        return;
      }
    }

    if (!prompt) {
      MessagePlugin.error('提示词数据不存在');
      return;
    }

    setTestLoading(true);
    setTestResult('');
    setTokenUsage(null);

    try {
      // 调用真实的 AI API
      const requestBody: Record<string, unknown> = {
        model: testForm.model,
        modelVersion: config.modelVersion,
        prompt: prompt.content,
        input: testForm.input,
      };

      if (testForm.model === 'ollama') {
        requestBody.baseUrl = (config as { baseUrl: string }).baseUrl;
      } else {
        requestBody.apiKey = (config as { apiKey: string }).apiKey;
      }

      const response = await fetch('/api/prompts/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '测试失败');
      }

      setTestResult(data.output);
      if (data.usage) {
        setTokenUsage(data.usage);
      }
      MessagePlugin.success('测试完成');
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '400px',
          }}
        >
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
        <div
          style={{
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                }}
              >
                {prompt.title}
              </h1>
              {prompt.description && (
                <p style={{ color: '#666', marginBottom: '12px' }}>
                  {prompt.description}
                </p>
              )}
              <Space size="small">
                {prompt.scene && (
                  <Tag
                    theme="primary"
                    style={{ background: prompt.scene.color }}
                  >
                    {prompt.scene.name}
                  </Tag>
                )}
                {prompt.model && <Tag>模型: {prompt.model}</Tag>}
                {prompt.tags &&
                  prompt.tags.map((tag, index) => (
                    <Tag key={index} size="small">
                      {tag}
                    </Tag>
                  ))}
              </Space>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="content">
          <TabPanel value="content" label="提示词内容" destroyOnHide={false}>
            <div style={{ padding: '12px' }}>
              <Card>
                <div
                  style={{
                    height: 'calc(100vh - 360px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                  }}
                >
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      background: '#f5f7fa',
                      padding: '16px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                    }}
                  >
                    {prompt.content}
                  </div>
                </div>
              </Card>
            </div>
          </TabPanel>

          <TabPanel value="test" label="在线测试" destroyOnHide={false}>
            <div
              style={{
                padding: '12px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}
            >
              <Card title="测试配置">
                <div
                  style={{
                    height: 'calc(100vh - 400px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                  }}
                >
                  <Form labelWidth={100} data={testForm}>
                    <FormItem label="选择模型" name="model">
                      <Select
                        value={testForm.model}
                        onChange={value => {
                          setTestForm({
                            ...testForm,
                            model: value as string,
                          });
                        }}
                      >
                        <Select.Option value="qwen" label="通义千问 (Qwen)" />
                        <Select.Option
                          value="hunyuan"
                          label="腾讯混元 (Hunyuan)"
                        />
                        <Select.Option value="deepseek" label="DeepSeek" />
                        <Select.Option value="ollama" label="Ollama (本地)" />
                      </Select>
                    </FormItem>
                    <FormItem label="测试内容" name="input">
                      <Textarea
                        placeholder="请输入测试内容"
                        value={testForm.input}
                        onChange={value =>
                          setTestForm({ ...testForm, input: value })
                        }
                        autosize={{ minRows: 8, maxRows: 12 }}
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
                <div
                  style={{
                    height: 'calc(100vh - 400px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                  }}
                >
                  {testLoading ? (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        minHeight: '400px',
                      }}
                    >
                      <Loading text="AI 生成中..." />
                    </div>
                  ) : testResult ? (
                    <>
                      {tokenUsage && (
                        <div
                          style={{
                            background: '#f0f9ff',
                            border: '1px solid #bae7ff',
                            borderRadius: '4px',
                            padding: '12px 16px',
                            marginBottom: '16px',
                            fontSize: '13px',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 'bold',
                              marginBottom: '8px',
                              color: '#0052d9',
                            }}
                          >
                            📊 Token 使用统计
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: '12px',
                            }}
                          >
                            <div>
                              <div style={{ color: '#666', marginBottom: '4px' }}>
                                输入 Tokens
                              </div>
                              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                {tokenUsage.promptTokens.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div style={{ color: '#666', marginBottom: '4px' }}>
                                输出 Tokens
                              </div>
                              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                {tokenUsage.completionTokens.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div style={{ color: '#666', marginBottom: '4px' }}>
                                总计 Tokens
                              </div>
                              <div
                                style={{
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  color: '#0052d9',
                                }}
                              >
                                {tokenUsage.totalTokens.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div
                        style={{
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          background: '#f5f7fa',
                          padding: '16px',
                          borderRadius: '4px',
                          fontSize: '14px',
                          lineHeight: '1.6',
                        }}
                      >
                        {testResult}
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        minHeight: '400px',
                        color: '#999',
                      }}
                    >
                      <PlayIcon size="48px" style={{ marginBottom: '16px' }} />
                      <p>点击"开始测试"查看结果</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
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
              <p>
                在这里配置各个 AI 模型的 API Key。这些密钥将安全地保存在您的浏览器本地存储中。
              </p>
            </div>

            <Divider />

            <Form labelWidth={150}>
              <div style={{ marginBottom: '24px' }}>
                <FormItem label="通义千问配置">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input
                      type="password"
                      placeholder="请输入通义千问 API Key"
                      value={apiKeyForm.qwen.apiKey}
                      onChange={value =>
                        setApiKeyForm({
                          ...apiKeyForm,
                          qwen: { ...apiKeyForm.qwen, apiKey: value },
                        })
                      }
                      prefixIcon={<LockOnIcon />}
                    />
                    <Input
                      placeholder="请输入模型版本（如：qwen-turbo）"
                      value={apiKeyForm.qwen.modelVersion}
                      onChange={value =>
                        setApiKeyForm({
                          ...apiKeyForm,
                          qwen: { ...apiKeyForm.qwen, modelVersion: value },
                        })
                      }
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        theme="primary"
                        onClick={() => handleSaveApiKey('qwen')}
                        icon={<CheckCircleIcon />}
                        style={{ flex: 1 }}
                      >
                        保存配置
                      </Button>
                      <Button
                        theme="danger"
                        variant="outline"
                        onClick={() => handleDeleteApiKey('qwen')}
                        disabled={!apiKeyForm.qwen.apiKey}
                        icon={<DeleteIcon />}
                      >
                        删除
                      </Button>
                    </div>
                    {apiKeyForm.qwen.apiKey && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        当前密钥: {maskApiKey(apiKeyForm.qwen.apiKey)}
                        {apiKeyForm.qwen.modelVersion &&
                          ` | 版本: ${apiKeyForm.qwen.modelVersion}`}
                      </div>
                    )}
                  </Space>
                </FormItem>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <FormItem label="腾讯混元配置">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input
                      type="password"
                      placeholder="请输入腾讯混元 API Key"
                      value={(apiKeyForm.hunyuan as { apiKey: string; modelVersion: string }).apiKey}
                      onChange={value =>
                        setApiKeyForm({
                          ...apiKeyForm,
                          hunyuan: { ...apiKeyForm.hunyuan, apiKey: value } as { apiKey: string; modelVersion: string },
                        })
                      }
                      prefixIcon={<LockOnIcon />}
                    />
                    <Input
                      placeholder="请输入模型版本（如：hunyuan-lite、hunyuan-standard、hunyuan-pro）"
                      value={apiKeyForm.hunyuan.modelVersion}
                      onChange={value =>
                        setApiKeyForm({
                          ...apiKeyForm,
                          hunyuan: {
                            ...(apiKeyForm.hunyuan as { apiKey: string; modelVersion: string }),
                            modelVersion: value,
                          },
                        })
                      }
                    />
                    <div
                      style={{
                        background: '#e3f2fd',
                        border: '1px solid #90caf9',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#1565c0',
                      }}
                    >
                      💡 提示：使用内部简化 API，仅需一个 Key 即可调用
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        theme="primary"
                        onClick={() => handleSaveApiKey('hunyuan')}
                        icon={<CheckCircleIcon />}
                        style={{ flex: 1 }}
                      >
                        保存配置
                      </Button>
                      <Button
                        theme="danger"
                        variant="outline"
                        onClick={() => handleDeleteApiKey('hunyuan')}
                        disabled={!(apiKeyForm.hunyuan as { apiKey: string }).apiKey}
                        icon={<DeleteIcon />}
                      >
                        删除
                      </Button>
                    </div>
                    {(apiKeyForm.hunyuan as { apiKey: string }).apiKey && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        当前密钥: {maskApiKey((apiKeyForm.hunyuan as { apiKey: string }).apiKey)}
                        {apiKeyForm.hunyuan.modelVersion &&
                          ` | 版本: ${apiKeyForm.hunyuan.modelVersion}`}
                      </div>
                    )}
                  </Space>
                </FormItem>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <FormItem label="DeepSeek配置">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input
                      type="password"
                      placeholder="请输入 DeepSeek API Key"
                      value={apiKeyForm.deepseek.apiKey}
                      onChange={value =>
                        setApiKeyForm({
                          ...apiKeyForm,
                          deepseek: { ...apiKeyForm.deepseek, apiKey: value },
                        })
                      }
                      prefixIcon={<LockOnIcon />}
                    />
                    <Input
                      placeholder="请输入模型版本（如：deepseek-chat）"
                      value={apiKeyForm.deepseek.modelVersion}
                      onChange={value =>
                        setApiKeyForm({
                          ...apiKeyForm,
                          deepseek: {
                            ...apiKeyForm.deepseek,
                            modelVersion: value,
                          },
                        })
                      }
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        theme="primary"
                        onClick={() => handleSaveApiKey('deepseek')}
                        icon={<CheckCircleIcon />}
                        style={{ flex: 1 }}
                      >
                        保存配置
                      </Button>
                      <Button
                        theme="danger"
                        variant="outline"
                        onClick={() => handleDeleteApiKey('deepseek')}
                        disabled={!apiKeyForm.deepseek.apiKey}
                        icon={<DeleteIcon />}
                      >
                        删除
                      </Button>
                    </div>
                    {apiKeyForm.deepseek.apiKey && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        当前密钥: {maskApiKey(apiKeyForm.deepseek.apiKey)}
                        {apiKeyForm.deepseek.modelVersion &&
                          ` | 版本: ${apiKeyForm.deepseek.modelVersion}`}
                      </div>
                    )}
                  </Space>
                </FormItem>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <FormItem label="Ollama配置（本地）">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input
                      placeholder="请输入 Ollama Base URL（如：http://localhost:11434）"
                      value={(apiKeyForm.ollama as { baseUrl: string; modelVersion: string }).baseUrl}
                      onChange={value =>
                        setApiKeyForm({
                          ...apiKeyForm,
                          ollama: { ...apiKeyForm.ollama, baseUrl: value } as { baseUrl: string; modelVersion: string },
                        })
                      }
                    />
                    <Input
                      placeholder="请输入模型名称（如：llama3、qwen2）"
                      value={apiKeyForm.ollama.modelVersion}
                      onChange={value =>
                        setApiKeyForm({
                          ...apiKeyForm,
                          ollama: {
                            ...(apiKeyForm.ollama as { baseUrl: string; modelVersion: string }),
                            modelVersion: value,
                          },
                        })
                      }
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        theme="primary"
                        onClick={() => handleSaveApiKey('ollama')}
                        icon={<CheckCircleIcon />}
                        style={{ flex: 1 }}
                      >
                        保存配置
                      </Button>
                      <Button
                        theme="danger"
                        variant="outline"
                        onClick={() => handleDeleteApiKey('ollama')}
                        disabled={!(apiKeyForm.ollama as { baseUrl: string }).baseUrl}
                        icon={<DeleteIcon />}
                      >
                        删除
                      </Button>
                    </div>
                    {(apiKeyForm.ollama as { baseUrl: string }).baseUrl && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        当前地址: {(apiKeyForm.ollama as { baseUrl: string }).baseUrl}
                        {apiKeyForm.ollama.modelVersion &&
                          ` | 模型: ${apiKeyForm.ollama.modelVersion}`}
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
                <li>在线测试功能会自动读取这里保存的配置</li>
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
                <span style={{ color: '#666', fontSize: '14px' }}>
                  内部 API：http://hunyuanapi.woa.com/openapi/v1/
                </span>
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#999' }}>
                  使用内部简化接口，仅需单个 API Key
                </div>
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
                <strong>Ollama (本地部署):</strong>
                <br />
                <a
                  href="https://ollama.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0052d9' }}
                >
                  https://ollama.com
                </a>
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#999' }}>
                  安装后默认地址: http://localhost:11434
                </div>
              </div>
            </div>
          </div>
        </Drawer>
      </div>
    </DashboardLayout>
  );
}
