import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

/**
 * A2UI 0.8 JSON Schema
 * 用于验证 AI 生成的 A2UI JSON 格式
 */
const A2UI_SCHEMA = {
  type: 'object',
  required: ['message', 'a2ui'],
  properties: {
    message: {
      type: 'string',
      description: '简短的提示语'
    },
    a2ui: {
      oneOf: [
        { type: 'null' },
        {
          type: 'object',
          required: ['components'],
          properties: {
            components: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['id', 'type', 'props'],
                properties: {
                  id: {
                    type: 'string',
                    minLength: 1,
                    description: '组件唯一标识符'
                  },
                  type: {
                    type: 'string',
                    enum: [
                      // 布局
                      'container',
                      // 输入
                      'textInput',
                      'textArea',
                      'datePicker',
                      'select',
                      'checkbox',
                      'radio',
                      // 展示
                      'text',
                      'heading',
                      'paragraph',
                      'list',
                      'table',
                      // 交互
                      'button',
                      'link',
                      // 反馈
                      'rating',
                      'progress',
                      // 复合
                      'form',
                      'card',
                      'accordion',
                      'tabs',
                      'divider',
                      // 媒体
                      'image',
                      'chart',
                      'map'
                    ],
                    description: '组件类型'
                  },
                  props: {
                    type: 'object',
                    description: '组件属性'
                  },
                  children: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '子组件ID列表'
                  },
                  weight: {
                    type: 'number',
                    description: '布局权重'
                  }
                }
              }
            }
          }
        }
      ]
    }
  }
};

const validate = ajv.compile(A2UI_SCHEMA);

/**
 * 验证 A2UI 响应格式
 * @param {object} data - 待验证的数据
 * @returns {object} { valid: boolean, errors: array }
 */
export function validateA2UIResponse(data) {
  const valid = validate(data);
  
  if (!valid) {
    console.error('❌ A2UI 验证失败:', validate.errors);
    return {
      valid: false,
      errors: validate.errors.map(err => ({
        path: err.instancePath,
        message: err.message,
        params: err.params
      }))
    };
  }

  // 额外验证：检查 children 引用的组件是否存在
  if (data.a2ui && data.a2ui.components) {
    const componentIds = new Set(data.a2ui.components.map(c => c.id));
    const invalidRefs = [];

    for (const component of data.a2ui.components) {
      if (component.children) {
        for (const childId of component.children) {
          if (!componentIds.has(childId)) {
            invalidRefs.push({
              componentId: component.id,
              missingChildId: childId
            });
          }
        }
      }
    }

    if (invalidRefs.length > 0) {
      console.error('❌ 无效的子组件引用:', invalidRefs);
      return {
        valid: false,
        errors: [{
          path: '/a2ui/components',
          message: `找不到引用的子组件: ${JSON.stringify(invalidRefs)}`,
          type: 'invalid_reference'
        }]
      };
    }
  }

  console.log('✅ A2UI 验证通过');
  return { valid: true, errors: [] };
}

/**
 * 格式化验证错误为可读的消息
 * @param {array} errors - 验证错误数组
 * @returns {string} 格式化的错误消息
 */
export function formatValidationErrors(errors) {
  if (!errors || errors.length === 0) {
    return '';
  }

  return errors.map(err => {
    if (err.type === 'invalid_reference') {
      return err.message;
    }
    return `${err.path}: ${err.message}`;
  }).join('; ');
}

/**
 * 获取 Schema 的友好描述（用于 Prompt）
 * @returns {string}
 */
export function getSchemaDescription() {
  return `
A2UI JSON 格式要求：
1. 必须包含 message (string) 和 a2ui (object|null)
2. a2ui.components 必须是数组，至少包含 1 个组件
3. 每个组件必须有:
   - id: 唯一字符串标识符
   - type: 组件类型（container, textInput, button, etc.）
   - props: 组件属性对象
   - children: (可选) 子组件ID数组
4. 所有 children 引用的 ID 必须存在于 components 数组中
  `.trim();
}

export default {
  validateA2UIResponse,
  formatValidationErrors,
  getSchemaDescription
};
