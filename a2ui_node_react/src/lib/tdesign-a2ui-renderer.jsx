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
  Popover,
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

  const componentMap = {
    // 表单组件
    form: () => (
      <Form key={key}>
        {props.title && (
          <>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{props.title}</h2>
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
        direction={props.direction === 'row' ? 'horizontal' : 'vertical'}
        size={props.gap === '8px' ? 'small' : props.gap === '24px' ? 'large' : 'medium'}
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
        theme={props.variant === 'primary' ? 'primary' : props.variant === 'danger' ? 'danger' : 'default'} 
        disabled={props.disabled}
        size={props.size || 'medium'}
      >
        {props.label || props.text}
      </Button>
    ),

    // 文本输入
    textInput: () => (
      <div key={key}>
        {props.label && <FormLabel label={props.label} required={props.required} />}
        <Input 
          placeholder={props.placeholder} 
          defaultValue={props.value} 
          disabled={props.disabled} 
          type={props.type || 'text'}
          clearable={props.clearable}
        />
      </div>
    ),

    // 文本域
    textArea: () => (
      <div key={key}>
        {props.label && <FormLabel label={props.label} required={props.required} />}
        <Input 
          type="textarea" 
          placeholder={props.placeholder} 
          defaultValue={props.value} 
          rows={props.rows || 4}
          maxlength={props.maxLength}
        />
      </div>
    ),

    // 复选框
    checkbox: () => (
      <Checkbox key={key} defaultChecked={props.checked} disabled={props.disabled}>
        {props.label}
      </Checkbox>
    ),

    // 单选框
    radio: () => (
      <Radio key={key} defaultChecked={props.checked} disabled={props.disabled}>
        {props.label}
      </Radio>
    ),

    // 单选框组
    radioGroup: () => (
      <div key={key}>
        {props.label && <FormLabel label={props.label} required={props.required} />}
        <RadioGroup defaultValue={props.value}>
          {props.options?.map((opt, idx) => (
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
        {props.label && <FormLabel label={props.label} required={props.required} />}
        <Select 
          defaultValue={props.value}
          placeholder={props.placeholder}
          disabled={props.disabled}
          clearable={props.clearable}
          options={props.options || []}
        />
      </div>
    ),

    // 开关
    switch: () => (
      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {props.label && <span>{props.label}</span>}
        <Switch defaultValue={props.checked} disabled={props.disabled} />
      </div>
    ),

    // 滑块
    slider: () => (
      <div key={key}>
        {props.label && <FormLabel label={props.label} />}
        <Slider 
          defaultValue={props.value || 0}
          min={props.min || 0}
          max={props.max || 100}
          step={props.step || 1}
          disabled={props.disabled}
        />
      </div>
    ),

    // 日期选择器
    datePicker: () => (
      <div key={key}>
        {props.label && <FormLabel label={props.label} required={props.required} />}
        <DatePicker 
          defaultValue={props.value}
          placeholder={props.placeholder}
          disabled={props.disabled}
          clearable={props.clearable}
        />
      </div>
    ),

    // 时间选择器
    timePicker: () => (
      <div key={key}>
        {props.label && <FormLabel label={props.label} required={props.required} />}
        <TimePicker 
          defaultValue={props.value}
          placeholder={props.placeholder}
          disabled={props.disabled}
          clearable={props.clearable}
        />
      </div>
    ),

    // 文件上传
    upload: () => (
      <div key={key}>
        {props.label && <FormLabel label={props.label} required={props.required} />}
        <Upload 
          theme={props.theme || 'file'}
          disabled={props.disabled}
          multiple={props.multiple}
          max={props.max}
        >
          <Button variant="outline">选择文件</Button>
        </Upload>
      </div>
    ),

    // 标题
    heading: () => {
      if (props.level && Typography?.Title) {
        return (
          <Typography.Title key={key} level={`h${props.level || 2}`}>
            {props.text}
          </Typography.Title>
        );
      }
      const HeadingTag = `h${props.level || 2}`;
      return React.createElement(HeadingTag, {
        key,
        style: { 
          margin: '16px 0 8px 0', 
          fontSize: HEADING_SIZES[props.level || 2], 
          fontWeight: 600 
        }
      }, props.text);
    },

    // 段落
    paragraph: () => {
      if (Typography?.Paragraph) {
        return (
          <Typography.Paragraph key={key} ellipsis={props.ellipsis}>
            {props.text}
          </Typography.Paragraph>
        );
      }
      return (
        <p key={key} style={{ margin: '8px 0', lineHeight: 1.6, color: '#4b5563' }}>
          {props.text}
        </p>
      );
    },

    // 文本
    text: () => {
      if (Typography?.Text) {
        return (
          <Typography.Text 
            key={key} 
            type={props.type}
            underline={props.underline}
            mark={props.mark}
            strong={props.strong}
          >
            {props.value || props.text}
          </Typography.Text>
        );
      }
      return (
        <span key={key} style={{ color: '#374151' }}>
          {props.value || props.text}
        </span>
      );
    },

    // 链接
    link: () => (
      <Link key={key} href={props.href} target={props.target || '_self'} hover={props.hover}>
        {props.text}
      </Link>
    ),

    // 卡片
    card: () => (
      <Card key={key} title={props.title} bordered={props.bordered !== false}>
        {props.subtitle && (
          <p style={{ color: '#6b7280', marginBottom: 12, fontSize: 14 }}>
            {props.subtitle}
          </p>
        )}
        {renderChildren(children, allComponents, id)}
      </Card>
    ),

    // 表格
    table: () => (
      <Table 
        key={key}
        data={props.data || []}
        columns={props.columns || []}
        bordered={props.bordered}
        stripe={props.stripe}
        pagination={props.pagination}
      />
    ),

    // 标签
    tag: () => (
      <Tag 
        key={key}
        theme={props.theme || 'default'}
        variant={props.variant || 'dark'}
        closable={props.closable}
        icon={props.icon}
      >
        {props.text || props.label}
      </Tag>
    ),

    // 徽章
    badge: () => (
      <Badge key={key} count={props.count} dot={props.dot} maxCount={props.maxCount}>
        {renderChildren(children, allComponents, id)}
      </Badge>
    ),

    // 头像
    avatar: () => (
      <Avatar 
        key={key}
        image={props.image}
        size={props.size || 'medium'}
        shape={props.shape || 'circle'}
      >
        {props.text}
      </Avatar>
    ),

    // 警告提示
    alert: () => (
      <Alert 
        key={key}
        theme={props.theme || 'info'}
        message={props.message || props.text}
        title={props.title}
        closable={props.closable}
      />
    ),

    // 进度条
    progress: () => (
      <div key={key}>
        {props.label && <FormLabel label={props.label} />}
        <Progress 
          percentage={props.percentage || 0}
          theme={props.theme}
          status={props.status}
          label={props.showLabel}
        />
      </div>
    ),

    // 列表
    list: () => (
      <List 
        key={key}
        split={props.split !== false}
        stripe={props.stripe}
      >
        {props.items?.map((item, idx) => (
          <List.ListItem key={idx}>{item}</List.ListItem>
        )) || renderChildren(children, allComponents, id)}
      </List>
    ),

    // 标签页
    tabs: () => (
      <Tabs key={key} defaultValue={props.defaultValue}>
        {props.items?.map((item, idx) => (
          <Tabs.TabPanel key={idx} value={item.value} label={item.label}>
            {item.content}
          </Tabs.TabPanel>
        )) || renderChildren(children, allComponents, id)}
      </Tabs>
    ),

    // 步骤条
    steps: () => (
      <Steps key={key} current={props.current || 0} theme={props.theme}>
        {props.items?.map((item, idx) => (
          <Steps.StepItem key={idx} title={item.title} content={item.content} />
        ))}
      </Steps>
    ),

    // 分页
    pagination: () => (
      <Pagination 
        key={key}
        total={props.total || 0}
        pageSize={props.pageSize || 10}
        current={props.current || 1}
        showJumper={props.showJumper}
      />
    ),

    // 面包屑
    breadcrumb: () => (
      <Breadcrumb key={key}>
        {props.items?.map((item, idx) => (
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
        options={props.options || []}
        disabled={props.disabled}
      >
        <Button>{props.text || '下拉菜单'}</Button>
      </Dropdown>
    ),

    // 提示框
    tooltip: () => (
      <Tooltip key={key} content={props.content} placement={props.placement}>
        {renderChildren(children, allComponents, id) || <span>{props.text}</span>}
      </Tooltip>
    ),

    // 气泡卡片
    popover: () => (
      <Popover key={key} content={props.content} placement={props.placement}>
        {renderChildren(children, allComponents, id) || <Button>{props.text}</Button>}
      </Popover>
    ),

    // 图片
    image: () => (
      <Image 
        key={key}
        src={props.src}
        alt={props.alt}
        fit={props.fit || 'cover'}
        lazy={props.lazy}
      />
    ),

    // 分割线
    divider: () => (
      <Divider 
        key={key}
        layout={props.layout || 'horizontal'}
        dashed={props.dashed}
      >
        {props.text}
      </Divider>
    ),

    // 间距
    space: () => (
      <Space 
        key={key}
        direction={props.direction || 'horizontal'}
        size={props.size || 'medium'}
        align={props.align}
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
