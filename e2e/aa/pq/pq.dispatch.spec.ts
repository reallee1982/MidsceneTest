import { expect } from '@playwright/test';
import { PlaywrightAgent } from '@midscene/web/playwright';
import type { PlayWrightAiFixtureType } from '@midscene/web/playwright';
import { PlaywrightAiFixture } from '@midscene/web/playwright';

import { test } from '../fixture';

const DEFAULT_WAIT_TIMEOUT_MS = 15_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const PART_NUMBER = '15200-EN20A';
const QUESTION = 'is it fit my car?';
const DEFAULT_VIEWPORT = { width: 1280, height: 768 };
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const DEFAULT_BASE_URL = 'https://npd.test.autobestdevops.com';


test('dispatch', async ({ openChat, aiAssert, aiTap, aiBoolean, page, agentForPage, aiInput}) => {
  await openChat();
  await test.step('校验AA窗口状态', async () => {
    await aiAssert('Ai Bot的聊天弹窗按顺序有 Order Status、RMA、Parts Availability、Parts Questions、Other Questions');
  });

  await test.step('Parts Questions', async () => {

    // const [popup] = await Promise.all([
    //   page.waitForEvent('popup'),
    //   aiTap('AI Bot的聊天弹窗的Parts Questions', { deepThink: true, cacheable: false }),
    // ]);
    // const popupPromise = page.waitForEvent('popup');
    // await aiTap('AI Bot的聊天弹窗的Parts Questions', { deepThink: true, cacheable: false });
    // const popupPage = await popupPromise;
    // popup.on('close', () => {
    //   console.log('popup was closed by the page');
    // });
    
    // 点击前的页面列表
    // const before = page.context().pages();
    // // 等待可能的新页面出现（失败则返回 null）
    // const [popup] = await Promise.all([
    //   page.waitForEvent('popup').catch(() => null),
    //   aiTap('AI Bot的聊天弹窗的Parts Questions', { deepThink: true, cacheable: false }),
    // ]);

    const beforePages = page.context().pages();

    // 先挂好 popup 监听
    const popupPromise = page.context().waitForEvent('page');

    // 触发点击（仅一次）
    await aiTap('AI Bot的聊天弹窗的Parts Questions', { deepThink: true, cacheable: false });

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
    
    
    // // 等待加载并获取 URL
    // try {
    //   await popupPage.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    // } catch (err) {
    //   console.log('popup url', popupPage.url());
    //   console.warn('popup load 超时/失败，继续执行后续步骤', err);
    // }
    // const popupUrl = popupPage.url();
    // console.log('pq url', popupUrl);
    const popupAgent = new PlaywrightAgent(newPage);
    // const popupAgent = await agentForPage(popupPage);
    
    await expect(async () => {
      await popupAgent.aiInput(
        "Enter the VIN of Your Vehicle",
        {value:'JN8AZ2KR0ET350093', deepThink: true, cacheable: false },
      );
    }).toPass({ timeout: 50_000, intervals: [3_000, 5_000, 5_000] });

    
    // await expect(async () => {
    //   await popupAgent.aiTap("continue", { deepThink: true, cacheable: false });
    //   // await sleep(5_000);
    //   await popupAgent.aiWaitFor("Parts Questions可见", { timeoutMs: 15000 });
    //   // await popupAgent.aiAssert("Vehicle Information,Part Fitment,Parts Questions可见");
    // }).toPass({ timeout: 50_000, intervals: [3_000, 5_000, 5_000] });

    await popupAgent.aiTap("continue", { deepThink: true, cacheable: false });
    await sleep(15_000);
    await popupAgent.aiWaitFor("Parts Questions可见", { timeoutMs: 100000 });
    await sleep(2_000);
    await popupAgent.aiAssert("Vin: JN8AZ2KR0ET350093可见");

    // await expect(async () => {
    //   await popupAgent.aiTap("Parts Questions", { deepThink: true, cacheable: false });
    //   await sleep(5_000);
    //   await popupAgent.aiAssert("Please enter your question and part number if you have one.");
    // }).toPass({ timeout: 30_000, intervals: [3_000, 5_000, 10_000] });
    await popupAgent.aiTap("Parts Questions", { deepThink: true, cacheable: false });
    await popupAgent.aiAssert("Please enter your question and part number if you have one.");
    await sleep(2_000);
    await popupAgent.aiAssert("两个输入框placeholder分别是Enter Your Questions和Enter Part Number可见");
    await popupAgent.aiInput("Enter Your Questions输入框", { value:QUESTION, deepThink: true, cacheable: false });
    await popupAgent.aiInput("Enter Part Number输入框", { value:PART_NUMBER, deepThink: true, cacheable: false });
    await popupAgent.aiAssert(`Enter Part Number输入框内文本是${PART_NUMBER}`);
    await popupAgent.aiAssert(`文本${QUESTION}可见`);

    // 设置接口监听
    const waitExtract = newPage.waitForResponse(
      (res) => res.url().includes('/pq/extractPartNumber') && res.request().method() === 'POST',
      { timeout: 60_000 },
    );
    const waitDispatch = newPage.waitForResponse(
      (res) => res.url().includes('/pq/dispatch') && res.request().method() === 'POST',
      { timeout: 60_000 },
    );

    // await expect(async () => {
    //   if (await popupAgent.aiBoolean("continue可见")) {
    //     await popupAgent.aiHover("continue按钮", { deepThink: true, cacheable: false });
    //   }
      
    // }).toPass({ timeout: 120_000, intervals: [3_000, 5_000, 5_000] });
    await popupAgent.aiHover("continue按钮", { deepThink: false, cacheable: true });
    await sleep(2_000);
    await popupAgent.aiTap("continue按钮", { deepThink: false, cacheable: true });
    await sleep(2_000);
    if (await popupAgent.aiBoolean("continue可见")) {
        await popupAgent.aiTap("continue按钮", { deepThink: false, cacheable: true });
    }
    await sleep(5_000);
    if (await popupAgent.aiBoolean("continue可见")) {
        await popupAgent.aiTap("continue按钮", { deepThink: false, cacheable: true });
    }
    await sleep(60_000);
    await popupAgent.aiWaitFor("Part 15200-EN20A fits your vehicle可见", { timeoutMs: 100000 });
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

    await popupAgent.aiAssert("显示Ask other parts questions和Complete this Chat按钮");
    await popupAgent.aiAssert("显示 15200-EN20A的零件信息包含Description、图片、价格");
    await popupAgent.aiAssert("显示Ask other parts questions和Complete this Chat按钮");

  });

});
