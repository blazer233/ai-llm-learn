import React from 'react';
import { z } from 'zod';
import { 
  Button, 
  Input, 
  Card, 
  Form, 
  Checkbox, 
  Link, 
  Space, 
  Divider,
  Radio,
  RadioGroup,
  Select,
  Switch,
  Slider,
  DatePicker,
  TimePicker,
  Upload,
  Table,
  Tag,
  Badge,
  Alert,
  Progress,
  Avatar,
  List,
  Tabs,
  Steps,
  Pagination,
  Breadcrumb,
  Dropdown,
  Tooltip,
  Popup,
  Image,
  Typography
} from 'tdesign-react';

const HEADING_SIZES = { 1: 28, 2: 24, 3: 20, 4: 18, 5: 16 };
const LABEL_STYLE = { display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 };

const findComponentById = (components, id) => components.find(c => c.id === id);

const isReferencedChild = (component, allComponents) => 
  allComponents.some(c => c.children?.includes?.(component.id));

const extractComponents = (operations) => {
  for (const op of operations) {
    if (op.components?.length) return op.components;
    if (op.beginRendering?.componentTree?.components) return op.beginRendering.componentTree.components;
    if (op.surfaceUpdate?.componentTree?.components) return op.surfaceUpdate.componentTree.components;
  }
  return [];
};

const FormLabel = ({ label, required }) => (
  <label style={LABEL_STYLE}>
    {label}
    {required && <span style={{ color: '#e34d59' }}> *</span>}
  </label>
);

const renderChildren = (children, allComponents, parentId) => {
  if (!children?.length) return null;
  return children
    .map((childId, idx) => {
      const child = findComponentById(allComponents, childId);
      return child ? renderA2UIComponent(child, allComponents, `${parentId}-${idx}`) : null;
    })
    .filter(Boolean);
};

/**
 * 将 A2UI 组件映射到 TDesign 组件
 * 支持 30+ 组件类型的完整映射
 */
function renderA2UIComponent(component, allComponents, index) {
  if (!component?.type) return null;

  const { id, type, props = {}, children = [] } = component;
  const key = index || id;

  // 确保props是对象类型，避免类型错误
  const safeProps = typeof props === 'object' && props !== null ? props : {};
  
  // 安全地处理options/items属性，确保是数组
  const safeOptions = Array.isArray(safeProps.options) ? safeProps.options : (Array.isArray(safeProps.items) ? safeProps.items : []);

  const componentMap = {
    // 表单组件
    form: () => (
      <Form key={key}>
        {safeProps.title && (
          <>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{safeProps.title}</h2>
            <Divider />
          </>
        )}
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {renderChildren(children, allComponents, id)}
        </Space>
      </Form>
    ),

    // 布局组件
    container: () => (
      <Space 
        key={key}
        direction={safeProps.direction === 'row' ? 'horizontal' : 'vertical'}
        size={safeProps.gap === '8px' ? 'small' : safeProps.gap === '24px' ? 'large' : 'medium'}
        style={{ width: '100%' }}
      >
        {renderChildren(children, allComponents, id)}
      </Space>
    ),

    // 按钮组件
    button: () => (
      <Button 
        key={key} 
        variant="base" 
        theme={safeProps.variant === 'primary' ? 'primary' : safeProps.variant === 'danger' ? 'danger' : 'default'} 
        disabled={safeProps.disabled}
        size={safeProps.size || 'medium'}
      >
        {safeProps.label || safeProps.text}
      </Button>
    ),

    // 文本输入
    textInput: () => (
      <div key={key}>
        {safeProps.label && <FormLabel label={safeProps.label} required={safeProps.required} />}
        <Input 
          placeholder={safeProps.placeholder} 
          defaultValue={safeProps.value} 
          disabled={safeProps.disabled} 
          type={safeProps.type || 'text'}
          clearable={safeProps.clearable}
        />
      </div>
    ),

    // 文本域
    textArea: () => (
      <div key={key}>
        {safeProps.label && <FormLabel label={safeProps.label} required={safeProps.required} />}
        <Input 
          type="textarea" 
          placeholder={safeProps.placeholder} 
          defaultValue={safeProps.value} 
          rows={safeProps.rows || 4}
          maxlength={safeProps.maxLength}
        />
      </div>
    ),

    // 复选框
    checkbox: () => (
      <Checkbox key={key} defaultChecked={safeProps.checked} disabled={safeProps.disabled}>
        {safeProps.label}
      </Checkbox>
    ),

    // 单选框
    radio: () => (
      <Radio key={key} defaultChecked={safeProps.checked} disabled={safeProps.disabled}>
        {safeProps.label}
      </Radio>
    ),

    // 单选框组
    radioGroup: () => (
      <div key={key}>
        {safeProps.label && <FormLabel label={safeProps.label} required={safeProps.required} />}
        <RadioGroup defaultValue={safeProps.value}>
          {safeProps.options?.map((opt, idx) => (
            <Radio key={idx} value={opt.value}>
              {opt.label}
            </Radio>
          ))}
        </RadioGroup>
      </div>
    ),

    // 下拉选择
    select: () => (
      <div key={key}>
        {safeProps.label && <FormLabel label={safeProps.label} required={safeProps.required} />}
        <Select 
          defaultValue={safeProps.value}
          placeholder={safeProps.placeholder}
          disabled={safeProps.disabled}
          clearable={safeProps.clearable}
          options={safeProps.options || []}
        />
      </div>
    ),

    // 开关
    switch: () => (
      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {safeProps.label && <span>{safeProps.label}</span>}
        <Switch defaultValue={safeProps.checked} disabled={safeProps.disabled} />
      </div>
    ),

    // 滑块
    slider: () => (
      <div key={key}>
        {safeProps.label && <FormLabel label={safeProps.label} />}
        <Slider 
          defaultValue={safeProps.value || 0}
          min={safeProps.min || 0}
          max={safeProps.max || 100}
          step={safeProps.step || 1}
          disabled={safeProps.disabled}
        />
      </div>
    ),

    // 日期选择器
    datePicker: () => (
      <div key={key}>
        {safeProps.label && <FormLabel label={safeProps.label} required={safeProps.required} />}
        <DatePicker 
          defaultValue={safeProps.value}
          placeholder={safeProps.placeholder}
          disabled={safeProps.disabled}
          clearable={safeProps.clearable}
        />
      </div>
    ),

    // 时间选择器
    timePicker: () => (
      <div key={key}>
        {safeProps.label && <FormLabel label={safeProps.label} required={safeProps.required} />}
        <TimePicker 
          defaultValue={safeProps.value}
          placeholder={safeProps.placeholder}
          disabled={safeProps.disabled}
          clearable={safeProps.clearable}
        />
      </div>
    ),

    // 文件上传
    upload: () => (
      <div key={key}>
        {safeProps.label && <FormLabel label={safeProps.label} required={safeProps.required} />}
        <Upload 
          theme={safeProps.theme || 'file'}
          disabled={safeProps.disabled}
          multiple={safeProps.multiple}
          max={safeProps.max}
        >
          <Button variant="outline">选择文件</Button>
        </Upload>
      </div>
    ),

    // 标题
    heading: () => {
      if (safeProps.level && Typography?.Title) {
        return (
          <Typography.Title key={key} level={`h${safeProps.level || 2}`}>
            {safeProps.text}
          </Typography.Title>
        );
      }
      const HeadingTag = `h${safeProps.level || 2}`;
      return React.createElement(HeadingTag, {
        key,
        style: { 
          margin: '16px 0 8px 0', 
          fontSize: HEADING_SIZES[safeProps.level || 2], 
          fontWeight: 600 
        }
      }, safeProps.text);
    },

    // 段落
    paragraph: () => {
      if (Typography?.Paragraph) {
        return (
          <Typography.Paragraph key={key} ellipsis={safeProps.ellipsis}>
            {safeProps.text}
          </Typography.Paragraph>
        );
      }
      return (
        <p key={key} style={{ margin: '8px 0', lineHeight: 1.6, color: '#4b5563' }}>
          {safeProps.text}
        </p>
      );
    },

    // 文本
    text: () => {
      if (Typography?.Text) {
        return (
          <Typography.Text 
            key={key} 
            type={safeProps.type}
            underline={safeProps.underline}
            mark={safeProps.mark}
            strong={safeProps.strong}
          >
            {safeProps.value || safeProps.text}
          </Typography.Text>
        );
      }
      return (
        <span key={key} style={{ color: '#374151' }}>
          {safeProps.value || safeProps.text}
        </span>
      );
    },

    // 链接
    link: () => (
      <Link key={key} href={safeProps.href} target={safeProps.target || '_self'} hover={safeProps.hover}>
        {safeProps.text}
      </Link>
    ),

    // 卡片
    card: () => (
      <Card key={key} title={safeProps.title} bordered={safeProps.bordered !== false}>
        {safeProps.subtitle && (
          <p style={{ color: '#6b7280', marginBottom: 12, fontSize: 14 }}>
            {safeProps.subtitle}
          </p>
        )}
        {renderChildren(children, allComponents, id)}
      </Card>
    ),

    // 表格
    table: () => (
      <Table 
        key={key}
        data={safeProps.data || []}
        columns={safeProps.columns || []}
        bordered={safeProps.bordered}
        stripe={safeProps.stripe}
        pagination={safeProps.pagination}
      />
    ),

    // 标签
    tag: () => (
      <Tag 
        key={key}
        theme={safeProps.theme || 'default'}
        variant={safeProps.variant || 'dark'}
        closable={safeProps.closable}
        icon={safeProps.icon}
      >
        {safeProps.text || safeProps.label}
      </Tag>
    ),

    // 徽章
    badge: () => (
      <Badge key={key} count={safeProps.count} dot={safeProps.dot} maxCount={safeProps.maxCount}>
        {renderChildren(children, allComponents, id)}
      </Badge>
    ),

    // 头像
    avatar: () => (
      <Avatar 
        key={key}
        image={safeProps.image}
        size={safeProps.size || 'medium'}
        shape={safeProps.shape || 'circle'}
      >
        {safeProps.text}
      </Avatar>
    ),

    // 警告提示
    alert: () => (
      <Alert 
        key={key}
        theme={safeProps.theme || 'info'}
        message={safeProps.message || safeProps.text}
        title={safeProps.title}
        closable={safeProps.closable}
      />
    ),

    // 进度条
    progress: () => (
      <div key={key}>
        {safeProps.label && <FormLabel label={safeProps.label} />}
        <Progress 
          percentage={safeProps.percentage || 0}
          theme={safeProps.theme}
          status={safeProps.status}
          label={safeProps.showLabel}
        />
      </div>
    ),

    // 列表
    list: () => (
      <List 
        key={key}
        split={safeProps.split !== false}
        stripe={safeProps.stripe}
      >
        {safeOptions.map((item, idx) => (
          <List.ListItem key={idx}>
            {typeof item === 'string' ? item : (item?.label || item?.text || item?.value || '')}
          </List.ListItem>
        )) || renderChildren(children, allComponents, id)}
      </List>
    ),

    // 标签页
    tabs: () => (
      <Tabs key={key} defaultValue={safeProps.defaultValue}>
        {safeOptions.map((item, idx) => (
          <Tabs.TabPanel key={idx} value={item.value} label={item.label}>
            {typeof item.content === 'string' ? item.content : ''}
          </Tabs.TabPanel>
        )) || renderChildren(children, allComponents, id)}
      </Tabs>
    ),

    // 步骤条
    steps: () => (
      <Steps key={key} current={safeProps.current || 0} theme={safeProps.theme}>
        {safeOptions.map((item, idx) => (
          <Steps.StepItem 
            key={idx} 
            title={typeof item === 'string' ? item : (item?.title || '')} 
            content={typeof item === 'object' ? (item?.content || '') : ''}
          />
        ))}
      </Steps>
    ),

    // 分页
    pagination: () => (
      <Pagination 
        key={key}
        total={safeProps.total || 0}
        pageSize={safeProps.pageSize || 10}
        current={safeProps.current || 1}
        showJumper={safeProps.showJumper}
      />
    ),

    // 面包屑
    breadcrumb: () => (
      <Breadcrumb key={key}>
        {safeProps.items?.map((item, idx) => (
          <Breadcrumb.BreadcrumbItem key={idx} href={item.href}>
            {item.label}
          </Breadcrumb.BreadcrumbItem>
        ))}
      </Breadcrumb>
    ),

    // 下拉菜单
    dropdown: () => (
      <Dropdown 
        key={key}
        options={safeProps.options || []}
        disabled={safeProps.disabled}
      >
        <Button>{safeProps.text || '下拉菜单'}</Button>
      </Dropdown>
    ),

    // 提示框
    tooltip: () => (
      <Tooltip key={key} content={safeProps.content} placement={safeProps.placement}>
        {renderChildren(children, allComponents, id) || <span>{safeProps.text}</span>}
      </Tooltip>
    ),

    // 气泡卡片
    popover: () => (
      <Popup key={key} content={safeProps.content} placement={safeProps.placement}>
        {renderChildren(children, allComponents, id) || <Button>{safeProps.text}</Button>}
      </Popup>
    ),

    // 图片
    image: () => (
      <Image 
        key={key}
        src={safeProps.src}
        alt={safeProps.alt}
        fit={safeProps.fit || 'cover'}
        lazy={safeProps.lazy}
      />
    ),

    // 分割线
    divider: () => (
      <Divider 
        key={key}
        layout={safeProps.layout || 'horizontal'}
        dashed={safeProps.dashed}
      >
        {safeProps.text}
      </Divider>
    ),

    // 间距
    space: () => (
      <Space 
        key={key}
        direction={safeProps.direction || 'horizontal'}
        size={safeProps.size || 'medium'}
        align={safeProps.align}
      >
        {renderChildren(children, allComponents, id)}
      </Space>
    ),
  };

  const Component = componentMap[type];
  return Component ? Component() : <div key={key}>{renderChildren(children, allComponents, id)}</div>;
}

export function createTDesignA2UIRenderer() {
  return {
    activityType: 'a2ui-surface',
    content: z.any(),
    render: ({ content }) => {
      if (!content?.operations) return null;

      const components = extractComponents(content.operations);
      if (!components.length) return null;

      const rootComponents = components.filter(comp => !isReferencedChild(comp, components));

      return (
        <div
          style={{
            width: '100%',
            margin: '16px 0',
            padding: '20px',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {rootComponents.map((comp, idx) => renderA2UIComponent(comp, components, idx))}
            </Space>
          </div>
          <div
            style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#6b7280',
              textAlign: 'center',
            }}
          >
            ✨ AI 生成的界面组件
          </div>
        </div>
      );
    },
  };
}
