import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { handleModel } from './tool.js';
import { modelConfigs } from './model-config.js';
import sharp from 'sharp';

const checkDomainArr = [
  'damp.woa.com',
  'tapd.woa.com',
  'yzftest.woa.com',
  'kfqm.woa.com',
];

function getDomain(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace(/[:\/\\?&=]/g, '_');
  } catch (e) {
    console.error(`Invalid URL provided: ${url}`);
    return null;
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '..', 'dist');
async function inspectPage(url) {
  let browser;
  let context;
  const domain = getDomain(url);
  if (!domain) {
    return;
  }
  const sessionFile = path.join(outputDir, `${domain}.json`);

  try {
    console.log('正在启动浏览器...');
    const sessionExists = existsSync(sessionFile);
    if (checkDomainArr.includes(domain) && !sessionExists) {
      console.log('需要登录，请在打开的浏览器窗口中完成登录...');
      browser = await chromium.launch({ headless: false });
      context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.pause();
      await context.storageState({ path: sessionFile });
      console.log('登录已完成，session 已保存。');
      await browser.close();
      return await inspectPage(url);
    }

    browser = await chromium.launch({
      headless: true,
      args: ['--ignore-certificate-errors'],
    });
    context = await browser.newContext({
      ignoreHTTPSErrors: true,
      storageState: sessionExists ? sessionFile : undefined,
    });
    console.log(' 浏览器已启动');
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page
      .waitForLoadState('networkidle', { timeout: 8000 })
      .catch(() => console.log('网络空闲等待超时，继续执行...'));

    console.log('正在截取页面...');
    const imageBuffer = await page.screenshot({
      fullPage: true,
      type: 'jpeg',
      quality: 80,
    });

    const screenshotPath = path.join(outputDir, `${domain}_screenshot.jpeg`);
    await fs.writeFile(screenshotPath, imageBuffer);
    console.log(`截图已保存至: ${screenshotPath}`);

    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('截图中发生错误:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('浏览器已关闭,开始分析图片...');
    }
  }
}

// --- 主执行函数 ---
const run = async name => {
  const modelinfo = modelConfigs[name];
  if (!modelinfo) {
    console.log('模型未配置');
    return;
  }
  const url = process.argv[2];
  if (!url) {
    console.log('请提供有效的URL参数');
    process.exit(1);
  }
  console.log(`开始对页面进行 AI 巡检: ${url} `);
  const startTime = Date.now();
  try {
    await fs.mkdir(outputDir, { recursive: true });

    const imageAsBase64 = await inspectPage(url);
    if (!imageAsBase64) {
      console.log('无法获取页面截图，巡检中止。');
      return;
    }
    console.log('开始分析');
    const res = await handleModel(name, imageAsBase64);

    if (res) {
      const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
      const [usage, content] = res;
      console.log(' AI 分析结果:', content);
      console.log(modelinfo.model + `总耗时: ${totalDuration}秒`);
      const llmRes = JSON.parse(content);
      const domain = getDomain(url);
      if (llmRes.anomalies && llmRes.anomalies.length) {
        console.log('发现异常，正在标记截图...');
        const screenshotPath = path.join(
          outputDir,
          `${domain}_screenshot.jpeg`
        );
        const annotatedImagePath = path.join(
          outputDir,
          `${domain}_annotated.jpeg`
        );

        const image = sharp(screenshotPath);
        const metadata = await image.metadata();
        const width = metadata.width;
        const height = metadata.height;

        const svgElements = llmRes.anomalies
          .map(anomaly => {
            const [x1, y1, x2, y2] = anomaly.bbox;
            // 创建一个半透明的红色矩形
            return `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${
              y2 - y1
            }" style="stroke:red; stroke-width:5; fill:none" />`;
          })
          .join('');

        const svgOverlay = `<svg width="${width}" height="${height}">${svgElements}</svg>`;

        await image
          .composite([{ input: Buffer.from(svgOverlay), blend: 'over' }])
          .toFile(annotatedImagePath);

        console.log(`已将标记的截图保存至: ${annotatedImagePath}`);
      }

      if (domain) {
        const resultPath = path.join(outputDir, `${domain}_result.json`);
        await fs.writeFile(
          resultPath,
          JSON.stringify({ status: usage, content, time: totalDuration })
        );
        console.log(`分析结果JSON已保存至: ${resultPath}`);
      }
    }
  } catch (error) {
    console.error(`AI 页面巡检最终失败: ${error}`);
    process.exit(1);
  }
};

run('qianwen');
