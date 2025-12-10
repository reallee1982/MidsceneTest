import { expect } from '@playwright/test';
import { PlaywrightAgent } from '@midscene/web/playwright';
import { test } from '../fixture';

const DEFAULT_WAIT_TIMEOUT_MS = 15_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const PART_NUMBER = '15200-EN20A';
const QUESTION = 'is it fit my car?';


test('dispatch', async ({ openChat, aiAssert, aiTap, aiBoolean, page, agentForPage, aiInput}) => {
  await openChat();
  await test.step('校验AA窗口状态', async () => {
    await aiAssert('AI Bot的聊天弹窗按顺序有 Order Status、RMA、Parts Availability、Parts Questions、Other Questions');
  });

  await test.step('Parts Questions', async () => {
    // 定位错误时重试
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      aiTap('AI Bot的聊天弹窗的Parts Questions', { deepThink: true, cacheable: false }),
    ]);
    popup.on('close', () => {
      console.log('popup was closed by the page');
    });
    await sleep(DEFAULT_WAIT_TIMEOUT_MS);
    
    
    // 等待加载并获取 URL
    try {
      await popup.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    } catch (err) {
      console.log('popup url', popup.url());
      console.warn('popup load 超时/失败，继续执行后续步骤', err);
    }
    const popupUrl = popup.url();
    console.log('pq url', popupUrl);
    // const popupAgent = new PlaywrightAgent(popup);
    const popupAgent = await agentForPage(popup);
    
    await expect(async () => {
      await sleep(5_000);
      await popupAgent.aiInput(
        
        "In order to answer your question(s) quickly and accurately, please input the VIN of your vehicle.下方的输入框",
        {value:'JN8AZ2KR0ET350093', deepThink: true, cacheable: false },
      );
    }).toPass({ timeout: 30_000, intervals: [3_000, 5_000, 10_000] });

    
    await expect(async () => {
      await popupAgent.aiTap("continue", { deepThink: true, cacheable: false });
      await sleep(10_000);
      await popupAgent.aiAssert("Vehicle Information,Part Fitment,Parts Questions可见");
    }).toPass({ timeout: 30_000, intervals: [3_000, 5_000, 10_000] });
    await sleep(2_000);
    await popupAgent.aiAssert("Vin: JN8AZ2KR0ET350093可见");

    await expect(async () => {
      await popupAgent.aiTap("Parts Questions", { deepThink: true, cacheable: false });
      await sleep(5_000);
      await popupAgent.aiAssert("Please enter your question and part number if you have one.");
    }).toPass({ timeout: 30_000, intervals: [3_000, 5_000, 10_000] });
    await sleep(2_000);
    await popupAgent.aiAssert("两个输入框Enter Your Questions和Enter Part Number可见");
    await popupAgent.aiInput("Parts Questions输入框", { value:QUESTION, deepThink: true, cacheable: false });
    await popupAgent.aiInput("Enter Part Number输入框", { value:PART_NUMBER, deepThink: true, cacheable: false });
    await popupAgent.aiAssert(`Enter Part Number输入框内文本是${PART_NUMBER}`);
    await popupAgent.aiAssert(`Parts Questions输入框内文本是${QUESTION}`);

    // 设置接口监听
    const waitExtract = popup.waitForResponse(
      (res) => res.url().includes('/pq/extractPartNumber') && res.request().method() === 'POST',
      { timeout: 60_000 },
    );
    const waitDispatch = popup.waitForResponse(
      (res) => res.url().includes('/pq/dispatch') && res.request().method() === 'POST',
      { timeout: 60_000 },
    );

    await expect(async () => {
      if (await popupAgent.aiBoolean("continue可见")) {
        await popupAgent.aiTap("continue", { deepThink: true, cacheable: false });
      }
      await sleep(DEFAULT_WAIT_TIMEOUT_MS);
      await popupAgent.aiAssert("Part 15200-EN20A fits your vehicle可见");
    }).toPass({ timeout: 30_000, intervals: [3_000, 5_000, 10_000] });
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
