import puppeteer from 'puppeteer';
import fs from 'fs';
const listItem = '.TDesign-doc-sidenav-group .TDesign-doc-sidenav-item a';
const desItem = 'td-doc-demo';

const start = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true, // 设为 true 则无头模式运行
      defaultViewport: null, // 使用默认视口大小
    });

    const page = await browser.newPage();
    await page.goto('https://tdesign.tencent.com/react/getting-started', {
      waitUntil: 'networkidle2', // 等待网络空闲
      timeout: 30000, // 超时时间60秒
    });
    console.log('页面已加载');
    await page.waitForSelector('.TDesign-doc-sidenav-group', {
      timeout: 30000,
    });
    const componentLinks = Array.from(
      await page.$$eval(listItem, links =>
        links.map(i => ({
          link: i.href,
          componentName: i.textContent.trim().split(' ')[0],
        }))
      )
    ).slice(7);

    let components = '';
    for (let i = 0; i < componentLinks.length; i++) {
      const { link, componentName } = componentLinks[i];
      const componentPage = await browser.newPage();
      await componentPage.goto(link, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      try {
        await componentPage.waitForSelector(desItem, { timeout: 30000 });

        const demoCode = await componentPage.$$eval(desItem, demos =>
          demos.map(demo => {
            // 替换高亮代码
            const getNodeTdCode = node => {
              if (!node) return '';
              const tdCodeElements = node?.querySelectorAll?.('td-code') || [];
              tdCodeElements.forEach?.((tdCode = {}) => {
                tdCode.textContent = tdCode.getAttribute('text') || '';
              });
              return node?.textContent;
            };
            return {
              code: demo.getAttribute('data-javascript'),
              desc: getNodeTdCode(demo.parentNode.previousSibling),
            };
          })
        );
        components += `${demoCode
          .map(
            i => `组建:<${componentName}/>
                  使用描述：${i.desc}
                  代码示例：${i.code}
                  `
          )
          .join('===SPLIT===')}`;
        console.log(
          `当前是：${componentName} ,还剩${componentLinks.length - i}个组件`
        );
      } catch (e) {
        console.log(e, `跳过 ${link} (未找到描述信息)`);
      } finally {
        // 关闭当前组件页
        await componentPage.close();
      }
    }
    // 输出文档
    if (!fs.existsSync('./txt')) fs.mkdirSync('./txt');
    fs.writeFileSync(`./output/index.txt`, components);

    // 7. 关闭浏览器
    await browser.close();
  } catch (error) {
    console.error('爬取过程中出错:', error);
  }
};

start();
