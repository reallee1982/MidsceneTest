import { expect } from '@playwright/test';
import { test } from '../../fixture';

const DEFAULT_WAIT_TIMEOUT_MS = 15_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const PART_NUMBER = '15200-EN20A';
const QUESTION = 'is it fit my car?';


test('dispatch', async ({ openChat, aiAssert, aiTap, aiInput, aiBoolean, page }) => {
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
    await sleep(DEFAULT_WAIT_TIMEOUT_MS);
    // 等待加载并获取 URL
    try {
      await popup.waitForLoadState('load', {timeout: 30_000});
    } catch (err) {
      console.warn('popup load 超时/失败，继续执行后续步骤', err);
    }
    const popupUrl = popup.url();
    console.log('pq url', popupUrl);
    
    await expect(async () => {
      sleep(5_000);
      const locator = await popup.getByPlaceholder("Enter the VIN of Your Vehicle", {exact: false});
      await expect(locator).toBeVisible();

      // await aiAssert("页面上有'Hi! I'm your assistant. I'm here to help you with the information that you need.'");
      await aiInput('JN8AZ2KR0ET350093', "In order to answer your question(s) quickly and accurately, please input the VIN of your vehicle.下方的输入框", { deepThink: true, cacheable: false });
    }).toPass({ timeout: 30_000, intervals: [3_000, 5_000, 10_000] });

    
    await expect(async () => {
      await aiTap("continue", { deepThink: true, cacheable: false });
      sleep(10_000);
      await aiAssert("Vehicle Information,Part Fitment,Parts Questions可见");
    }).toPass({ timeout: 30_000, intervals: [3_000, 5_000, 10_000] });
    sleep(2_000);
    await aiAssert("Vin: JN8AZ2KR0ET350093可见");

    await expect(async () => {
      await aiTap("Parts Questions", { deepThink: true, cacheable: false });
      sleep(5_000);
      await aiAssert("Please enter your question and part number if you have one.");
    }).toPass({ timeout: 30_000, intervals: [3_000, 5_000, 10_000] });
    sleep(2_000);
    await aiAssert("两个输入框Enter Your Questions和Enter Part Number可见");
    await aiInput(QUESTION, "Parts Questions输入框", { deepThink: true, cacheable: false });
    await aiInput(PART_NUMBER, "Enter Part Number输入框", { deepThink: true, cacheable: false });
    await aiAssert(`Enter Part Number输入框内文本是${PART_NUMBER}`);
    await aiAssert(`Parts Questions输入框内文本是${QUESTION}`);

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
      if (await aiBoolean("continue可见")) {
        await aiTap("continue", { deepThink: true, cacheable: false });
      }
      sleep(DEFAULT_WAIT_TIMEOUT_MS);
      await aiAssert("Part 15200-EN20A fits your vehicle可见");
    }).toPass({ timeout: 30_000, intervals: [3_000, 5_000, 10_000] });
    sleep(2_000);

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

    await aiAssert("显示Ask other parts questions和Complete this Chat按钮");
    await aiAssert("显示 15200-EN20A的零件信息包含Description、图片、价格");
    await aiAssert("显示Ask other parts questions和Complete this Chat按钮");

  });

});