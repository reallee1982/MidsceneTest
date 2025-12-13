import { expect } from '@playwright/test';
import { PlaywrightAgent } from '@midscene/web/playwright';

import { test } from '../fixture';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// const PART_NUMBER = '15200-EN20A';
const PART_NUMBER = '15200-EN20A';
const QUESTION = 'is it fit my car?';
const VIN = 'JN8AZ2KR0ET350093';
const DEFAULT_VIEWPORT = { width: 1280, height: 768 };
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';



test('dispatch', async ({ openChat, aiAssert, aiTap, aiBoolean, page, agentForPage, aiInput}) => {
  await openChat();
  await test.step('校验AA窗口状态', async () => {
    await aiAssert('Ai Bot的聊天弹窗按顺序有 Order Status、RMA、Parts Availability、Parts Questions、Other Questions');
  });

  await test.step('Parts Questions', async () => {

    const beforePages = page.context().pages();

    // 先挂好 popup 监听
    const popupPromise = page.context().waitForEvent('page');

    // 触发点击（仅一次）
    await aiTap('AI Bot的聊天弹窗的Parts Questions', { deepThink: false, cacheable: false });

    // 尝试获取新页
    let popupPage = await popupPromise;

    // 如果没有新页，说明是当前 tab 导航
    if (!popupPage || popupPage.isClosed()) {
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/assistant\/pq/i, { timeout: 30_000 }); // 用实际匹配的 URL 规则
      popupPage = page;
      console.log('popup url1:', popupPage.url());
    } else {
      const afterPages = page.context().pages();
      popupPage = afterPages.find(p => !beforePages.includes(p)) ?? page;
      await popupPage.waitForLoadState('domcontentloaded');
      console.log('popup url2:', popupPage.url());
    }
    await sleep(1000);
    popupPage = page.context().pages().findLast(p => !p.isClosed()) ?? page;
    console.log('popupPage url', popupPage.url());

    
    const newPage = await page.context().newPage();
    await newPage.setViewportSize(DEFAULT_VIEWPORT);
    await newPage.setExtraHTTPHeaders({ 'User-Agent': DEFAULT_USER_AGENT });
    await newPage.goto(popupPage.url(), { waitUntil: 'load',});
    await sleep(3000);
    
    const popupAgent = new PlaywrightAgent(newPage);
    
    await expect(async () => {
      await popupAgent.aiInput(
        "Enter the VIN of Your Vehicle",
        {value:`${VIN}`, deepThink: false, cacheable: false },
      );
    }).toPass({ timeout: 50_000, intervals: [3_000, 5_000, 5_000] });

    await popupAgent.aiTap("continue", { deepThink: false, cacheable: false });
    await sleep(10_000);
    await popupAgent.aiWaitFor("Parts Questions可见", { timeoutMs: 100000 });
    await sleep(2_000);
    await popupAgent.aiAssert(`Vin: ${VIN}可见`);

    await popupAgent.aiTap("Parts Questions", { deepThink: false, cacheable: false });
    await popupAgent.aiAssert("Please enter your question and part number if you have one.");
    await sleep(2_000);
    await popupAgent.aiAssert("两个输入框placeholder分别是Enter Your Questions和Enter Part Number可见");
    await popupAgent.aiInput("Enter Your Questions输入框", { value:QUESTION, deepThink: false, cacheable: false });
    await popupAgent.aiInput("Enter Part Number输入框", { value:PART_NUMBER, deepThink: false, cacheable: false });
    await popupAgent.aiAssert(`Enter Part Number输入框内文本是${PART_NUMBER}`);
    await popupAgent.aiAssert(`文本${QUESTION}可见`);

    // 设置接口监听
    const waitExtract = newPage.waitForResponse(
      (res) => res.url().includes('/pq/extractPartNumber') && res.request().method() === 'POST',
      { timeout: 300_000 },
    );
    const waitDispatch = newPage.waitForResponse(
      (res) => res.url().includes('/pq/dispatch') && res.request().method() === 'POST',
      { timeout: 300_000 },
    );
 
    console.log('popupAgent2:', popupAgent.page.url());
    if (await popupAgent.aiBoolean("continue按钮可见")) {
        await popupAgent.aiTap("continue按钮", { deepThink: false, cacheable: false });
    }
 
    await sleep(50_000);
    await popupAgent.aiWaitFor(`Part ${PART_NUMBER} fits your vehicle可见`, { checkIntervalMs:50_000, timeoutMs: 100000 });
    await sleep(2_000);

    const [extractRes, dispatchRes] = await Promise.all([waitExtract, waitDispatch]);

    // 校验接口状态和字段
    expect(extractRes.status()).toBe(200);
    const extractBody = await extractRes.json();
    expect(extractBody?.data?.partLegal).toBe(true);
    expect(extractBody?.data?.inputPartNumber).toBe(PART_NUMBER);

    expect(dispatchRes.status()).toBe(200);
    const dispatchBody = await dispatchRes.json();
    expect(dispatchBody?.data?.partLegal).toBe(true);
    expect(dispatchBody?.data?.partDetail?.partNumber).toBe(PART_NUMBER);

    await popupAgent.aiAssert(`显示 ${PART_NUMBER}的零件信息包含Description、图片、价格`);
    await sleep(2_000);

    await popupAgent.aiAssert("Ask other parts questions按钮可见");
    await popupAgent.aiAssert("Complete this Chat按钮可见");


  });

});
