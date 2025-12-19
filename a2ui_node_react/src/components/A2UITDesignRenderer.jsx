'use client';

import { useState, useRef } from 'react';
import {
  Input,
  Textarea,
  Select,
  Button,
  Checkbox,
  Radio,
  DatePicker,
  Form,
  Card,
  Table,
  Progress,
  Rate,
  Divider,
  Space,
  Image,
  Link,
  Typography,
  List,
  Collapse,
  Tabs,
  Tag,
  MessagePlugin
} from 'tdesign-react';
import 'tdesign-react/es/style/index.css';

const { FormItem } = Form;
const { Option } = Select;
const { Text, Title, Paragraph } = Typography;
const { ListItem, ListItemMeta } = List;
const { Panel } = Collapse;
const { TabPanel } = Tabs;

/**
 * 基于 TDesign 的 A2UI 渲染器
 * 使用腾讯 TDesign 组件库替代自定义组件
 */
const A2UITDesignRenderer = ({ a2ui }) => {
  const [formData, setFormData] = useState({});
  const [tabStates, setTabStates] = useState({});
  const formRef = useRef(null);

  if (!a2ui || !a2ui.components) {
    return null;
  }

  const handleInputChange = (id, value) => {
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    console.log('📤 Form submitted:', formData);
    MessagePlugin.success({
      content: `提交成功！`,
      duration: 3000,
      closeBtn: true
    });
  };

  const renderComponent = (component) => {
    const { id, type, props, children } = component;

    switch (type) {
      // === 布局容器 ===
      case 'container':
        return (
          <Space
            key={id}
            direction={props.direction === 'horizontal' ? 'horizontal' : 'vertical'}
            size={props.gap || 'medium'}
            style={{ padding: props.padding || '0', width: '100%' }}
          >
            {children && children.map(childId => {
              const child = a2ui.components.find(c => c.id === childId);
              return child ? renderComponent(child) : null;
            })}
          </Space>
        );

      // === 输入组件 ===
      case 'textInput':
        return (
          <FormItem
            key={id}
            label={props.label}
            name={id}
            rules={props.required ? [{ required: true, message: `${props.label}不能为空` }] : []}
          >
            <Input
              placeholder={props.placeholder || '请输入'}
              value={formData[id] || props.value || ''}
              disabled={props.disabled}
              onChange={(value) => handleInputChange(id, value)}
              clearable
            />
          </FormItem>
        );

      case 'textArea':
        return (
          <FormItem
            key={id}
            label={props.label}
            name={id}
            rules={props.required ? [{ required: true, message: `${props.label}不能为空` }] : []}
          >
            <Textarea
              placeholder={props.placeholder || '请输入'}
              value={formData[id] || props.value || ''}
              maxlength={props.maxLength}
              autosize={{ minRows: props.rows || 3, maxRows: props.maxRows || 6 }}
              onChange={(value) => handleInputChange(id, value)}
            />
          </FormItem>
        );

      case 'datePicker':
        return (
          <FormItem
            key={id}
            label={props.label}
            name={id}
          >
            <DatePicker
              value={formData[id] || props.value || ''}
              onChange={(value) => handleInputChange(id, value)}
              clearable
              enableTimePicker={props.enableTime || false}
            />
          </FormItem>
        );

      case 'select':
        // 支持字符串数组和对象数组两种格式
        const options = props.options?.map(opt => {
          if (typeof opt === 'string') {
            return { label: opt, value: opt };
          }
          return opt;
        }) || [];
        
        return (
          <FormItem
            key={id}
            label={props.label}
            name={id}
            rules={props.required ? [{ required: true, message: `请选择${props.label}` }] : []}
          >
            <Select
              value={formData[id] || props.value || ''}
              onChange={(value) => handleInputChange(id, value)}
              placeholder="请选择"
              clearable
            >
              {options.map((option, idx) => (
                <Option key={idx} value={option.value} label={option.label}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </FormItem>
        );

      case 'checkbox':
        return (
          <FormItem key={id} name={id}>
            <Checkbox
              checked={formData[id] || props.checked || false}
              value={props.value}
              onChange={(checked) => handleInputChange(id, checked)}
            >
              {props.label}
            </Checkbox>
          </FormItem>
        );

      case 'radio':
        return (
          <FormItem key={id} name={id}>
            <Radio
              name={props.name}
              checked={formData[id] || props.checked || false}
              value={props.value}
              onChange={(checked) => handleInputChange(id, checked)}
            >
              {props.label}
            </Radio>
          </FormItem>
        );

      // === 展示组件 ===
      case 'text':
        return (
          <Text
            key={id}
            style={{
              textAlign: props.align || 'left',
              fontSize: props.size || '14px',
              color: props.color
            }}
          >
            {props.value}
          </Text>
        );

      case 'heading':
        return (
          <Title
            key={id}
            level={props.level || 2}
            style={{ margin: '16px 0 8px' }}
          >
            {props.text}
          </Title>
        );

      case 'paragraph':
        return (
          <Paragraph key={id} style={{ margin: '8px 0' }}>
            {props.text}
          </Paragraph>
        );

      case 'list':
        return (
          <Space key={id} direction="vertical" style={{ width: '100%' }}>
            {props.title && (
              <Title level={3} style={{ marginBottom: '12px' }}>
                {props.title}
              </Title>
            )}
            <List split={false}>
              {props.items && props.items.map((item, idx) => (
                <ListItem key={idx}>
                  {typeof item === 'string' ? (
                    <Text>{item}</Text>
                  ) : (
                    <ListItemMeta
                      title={item.title}
                      description={item.description}
                    />
                  )}
                </ListItem>
              ))}
            </List>
          </Space>
        );

      case 'table':
        const columns = props.columns?.map((col, idx) => ({
          colKey: `col${idx}`,
          title: col,
          width: 'auto'
        })) || [];

        const data = props.rows?.map((row, idx) => {
          const rowData = { id: idx };
          row.forEach((cell, cellIdx) => {
            rowData[`col${cellIdx}`] = cell;
          });
          return rowData;
        }) || [];

        return (
          <Space key={id} direction="vertical" style={{ width: '100%', marginTop: '16px', marginBottom: '16px' }}>
            <Table
              data={data}
              columns={columns}
              rowKey="id"
              bordered
              hover
              stripe
              size="medium"
            />
          </Space>
        );

      // === 交互组件 ===
      case 'button':
        return (
          <Button
            key={id}
            type={props.action === 'submit' ? 'submit' : 'button'}
            theme={props.variant === 'primary' ? 'primary' : props.variant === 'danger' ? 'danger' : 'default'}
            disabled={props.disabled}
            onClick={props.action === 'submit' ? handleSubmit : undefined}
            style={{ marginTop: '16px' }}
          >
            {props.label || 'Button'}
          </Button>
        );

      case 'link':
        return (
          <Link
            key={id}
            href={props.href}
            target={props.target || '_self'}
            hover="color"
          >
            {props.text}
          </Link>
        );

      // === 媒体组件 ===
      case 'image':
        return (
          <Space key={id} direction="vertical" style={{ marginTop: '16px', marginBottom: '16px' }}>
            <Image
              src={props.src}
              alt={props.alt || '图片'}
              fit={props.fit || 'cover'}
              style={{
                width: props.width || 'auto',
                height: props.height || 'auto',
                maxWidth: '100%',
                borderRadius: '4px'
              }}
              lazy
              error="加载失败"
              loading="加载中..."
            />
          </Space>
        );

      case 'chart':
        return (
          <Card
            key={id}
            bordered
            style={{ marginTop: '16px', marginBottom: '16px', textAlign: 'center' }}
          >
            <Space direction="vertical" align="center">
              <Text>📊 图表组件 ({props.type || 'unknown'})</Text>
              <Text theme="secondary" style={{ fontSize: '12px' }}>
                需要集成图表库（如 ECharts）
              </Text>
            </Space>
          </Card>
        );

      case 'map':
        return (
          <Card
            key={id}
            bordered
            style={{ marginTop: '16px', marginBottom: '16px', textAlign: 'center' }}
          >
            <Space direction="vertical" align="center">
              <Text>🗺️ 地图组件</Text>
              <Text theme="secondary" style={{ fontSize: '12px' }}>
                位置: {props.latitude}, {props.longitude} (缩放: {props.zoom || 10})
              </Text>
            </Space>
          </Card>
        );

      // === 反馈组件 ===
      case 'rating':
        return (
          <FormItem key={id} label={props.label}>
            <Rate
              value={formData[id] || props.value || 0}
              count={props.max || 5}
              onChange={(value) => !props.readOnly && handleInputChange(id, value)}
              disabled={props.readOnly}
            />
          </FormItem>
        );

      case 'progress':
        const percentage = props.max ? ((props.value || 0) / props.max) * 100 : (props.value || 0);
        return (
          <Space key={id} direction="vertical" style={{ width: '100%', marginTop: '16px', marginBottom: '16px' }}>
            {props.label && <Text>{props.label}</Text>}
            <Progress
              percentage={percentage}
              label={`${props.value || 0} / ${props.max || 100}`}
              theme="line"
            />
          </Space>
        );

      // === 复合组件 ===
      case 'form':
        return (
          <Form
            key={id}
            ref={formRef}
            data={formData}
            onSubmit={handleSubmit}
            labelWidth={100}
            layout="vertical"
            style={{ marginTop: '16px' }}
          >
            {props.title && (
              <Title level={3} style={{ marginBottom: '24px' }}>
                {props.title}
              </Title>
            )}
            {children && children.map(childId => {
              const child = a2ui.components.find(c => c.id === childId);
              return child ? renderComponent(child) : null;
            })}
          </Form>
        );

      case 'card':
        return (
          <Card
            key={id}
            title={props.title}
            subtitle={props.subtitle}
            bordered
            hoverShadow
            style={{ marginTop: '16px', marginBottom: '16px' }}
          >
            {children && children.map(childId => {
              const child = a2ui.components.find(c => c.id === childId);
              return child ? renderComponent(child) : null;
            })}
          </Card>
        );

      case 'accordion':
        return (
          <Collapse
            key={id}
            defaultValue={props.expandedIndex !== undefined ? [String(props.expandedIndex)] : []}
            style={{ marginTop: '16px', marginBottom: '16px' }}
          >
            {props.items && props.items.map((item, idx) => (
              <Panel
                key={idx}
                header={item.title}
                value={String(idx)}
              >
                <Text>{item.content}</Text>
              </Panel>
            ))}
          </Collapse>
        );

      case 'tabs':
        const currentTab = tabStates[id] !== undefined ? tabStates[id] : (props.activeTab || 0);
        return (
          <Tabs
            key={id}
            value={String(currentTab)}
            onChange={(value) => setTabStates(prev => ({ ...prev, [id]: parseInt(value) }))}
            style={{ marginTop: '16px', marginBottom: '16px' }}
          >
            {props.tabs && props.tabs.map((tab, idx) => (
              <TabPanel
                key={idx}
                value={String(idx)}
                label={tab.label}
              >
                <Space direction="vertical" style={{ padding: '16px' }}>
                  <Text>{tab.content}</Text>
                </Space>
              </TabPanel>
            ))}
          </Tabs>
        );

      // === 分隔线 ===
      case 'divider':
        return <Divider key={id} />;

      // === 默认 ===
      default:
        return (
          <Card
            key={id}
            bordered
            style={{
              background: '#fff3e0',
              border: '1px dashed #ff9800',
              marginTop: '8px'
            }}
          >
            <Text theme="warning">⚠️ 未知组件类型: {type}</Text>
          </Card>
        );
    }
  };

  return (
    <div className="a2ui-renderer">
      <div style={{ padding: '24px' }}>
        {a2ui.components.map(component => {
          // 只渲染顶层组件（不是 children）
          const isChild = a2ui.components.some(c =>
            c.children && c.children.includes(component.id)
          );
          if (isChild) return null;
          return renderComponent(component);
        })}
      </div>

      <style jsx global>{`
        .a2ui-renderer {
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default A2UITDesignRenderer;
