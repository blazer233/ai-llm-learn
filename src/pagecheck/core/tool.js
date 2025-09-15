import OpenAI from 'openai';
import { modelConfigs } from './model-config.js';

const prompt = `
你是一个专业的页面异常检测系统，负责分析各类页面截图（包括Web页面、移动端界面等），发现所有可能的页面异常。请严格按照以下步骤和要求执行：

## 检测步骤

### 第一步：文字区域详细检查（必须执行）
- 使用中文
- 依次检查页面的主要文字区域。
- 对每个文字区域，判断：
  - 能否清晰读出文字内容？
  - 文字行与行之间是否有正常间距？
  - 是否存在多行文字叠加、密度异常高、无法区分的情况？（水印不属于异常）
- 对于无法清晰阅读、文字重叠、密度异常高的区域，**必须标记为 rendering_issue**，严重程度为 high。

### 第二步：全局异常检测
- 检查所有常见页面异常，包括但不限于：
  - **incomplete_element**: 元素显示不完整（如文字、图片、按钮等被截断）
  - **error_message**: 错误提示信息（如“加载失败”、“404”等）
  - **layout_anomaly**: 布局错位、不对称、容器溢出
  - **loading_issue**: loading 卡住、图片加载失败
  - **empty_content**: 应有内容但显示空白，"暂无数据"不一定属于异常
  - **rendering_issue**: 渲染问题（如元素重叠、样式丢失等视觉问题）

## 严重程度

  - **high**: 严重影响使用（如内容截断、明显错误、文字重叠无法阅读）
  - **medium**: 部分影响体验（如轻微错位）
  - **low**: 轻微问题（如颜色略异常）

## 输出要求
- **必须输出可被JSON.parse解析的纯JSON，不许返回md格式内容，合并所有检测到的异常，严格按如下格式：**
- **bbox**格式：[x1, y1, x2, y2]，归一化坐标（0-1范围），必须准确标记异常区域实际位置，不得使用示例坐标。

{
  "anomaly_detected": true,
  "anomalies": [
    {
      "type": "", // 异常类型
      "bbox": '', // 异常区域坐标
      "confidence": , // 置信度
      "severity": "", // 严重程度
      "description": "" // 异常描述
    },
    ...
  ]
}

- **无异常时输出：**

  {
  "anomaly_detected": false,
  "anomalies": []
  }

## 检测重点提醒

- 先检查所有文字区域的可读性，再检查其他异常。
- 任何无法清晰阅读的文字区域都必须标记为 rendering_issue。
- 不要遗漏元素不完整、加载异常、布局错位等其他问题。
- 输出时合并所有异常，确保每个异常都单独标注 bbox、类型、置信度、严重程度和描述。

请仔细观察页面截图，确保不遗漏任何显示异常，尤其注意文字区域的可读性和页面元素的完整性。
`;

export const handleModel = async (name, imageAsBase64) => {
  const { apiKey, baseURL, model, headers } = modelConfigs[name];
  const openai = new OpenAI({ apiKey, baseURL });
  const otherData = headers ? { headers } : {};
  const res = await openai.chat.completions.create(
    {
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageAsBase64}` },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
      stream: false,
    },
    otherData
  );
  return [res.usage, res.choices[0].message.content];
};
