import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { handleModel } from './tool.js';
import { modelConfigs } from './model-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 1.生成一个dist文件来保存生成的json和截图
const outputDir = path.join(__dirname, '..', 'dist');
const checkDomainArr = ['damp.woa.com'];
function getDomain(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace(/[:\/\\?&=]/g, '_');
  } catch (e) {
    console.error(`Invalid URL provided: ${url}`);
    return null;
  }
}

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
      context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.pause();
      await context.storageState({ path: sessionFile });
      console.log('登录已完成，session 已保存。');
      await browser.close();
      return await inspectPage(url);
    }

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ storageState: sessionFile || null });
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

      // 2.将ai输出的一同保存到dist文件下
      const domain = getDomain(url);
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

run('hunyuan');
