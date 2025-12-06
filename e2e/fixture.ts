import { expect, test as base } from '@playwright/test';
import type { PlayWrightAiFixtureType } from '@midscene/web/playwright';
import { PlaywrightAiFixture } from '@midscene/web/playwright';
    
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DEFAULT_VIEWPORT = { width: 1280, height: 768 };
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const DEFAULT_BASE_URL = 'https://npd.test.autobestdevops.com';
const DEFAULT_WAIT_TIMEOUT_MS = 15_000;

type ChatFixture = {
  openChat: (options?: { waitTimeoutMs?: number }) => Promise<void>;
};

const testWithAi = base.extend<PlayWrightAiFixtureType>({
  ...PlaywrightAiFixture({ cache: process.env.MIDSCENE_CACHE ? true : false }),
});

export const test = testWithAi.extend<PlayWrightAiFixtureType & ChatFixture>({
  aiTap: async ({ aiTap: baseAiTap }, use) => {
    const aiTapWithDelay: typeof baseAiTap = async (...args) => {
      await sleep(2000);
      return baseAiTap(...args);
    };

    await use(aiTapWithDelay);
  },
  openChat: async ({ aiTap, aiWaitFor, aiBoolean, aiScroll }, use) => {
    const openChat = async ({ waitTimeoutMs = DEFAULT_WAIT_TIMEOUT_MS } = {}) => {
      await base.step('打开聊天浮窗', async () => {
        await aiWaitFor('右下角蓝色的聊天弹窗按钮可见', { timeoutMs: waitTimeoutMs });
        // 定位错误时重试
        await expect(async () => {
          await aiTap('右下角蓝色的聊天弹窗按钮', { deepThink: true, cacheable: false });
          await aiWaitFor('右边AI Bot的聊天弹窗可见', { timeoutMs: waitTimeoutMs });
        }).toPass({ timeout: 30_000, intervals: [3_000, 5_000, 10_000] });
      });

      await base.step('选择聊天入口', async () => {
        await aiWaitFor("AI Bot的聊天弹窗有Let's chat或Start the chat", { timeoutMs: waitTimeoutMs });
        // 定位错误时重试
        await expect(async () => {
          if (await aiBoolean("AI Bot的聊天弹窗有Let's chat")) {
            console.log("AI Bot的聊天弹窗的Let's chat按钮可见");
            await aiTap("AI Bot的聊天弹窗的Let's chat按钮", { deepThink: true, cacheable: false });

          } else if (await aiBoolean('AI Bot的聊天弹窗有Start the chat')) {
            console.log("AI Bot的聊天弹窗的Start the chat按钮可见");
            await aiTap('AI Bot的聊天弹窗的Start the chat按钮', { deepThink: true, cacheable: false });
          } else {
            expect(false, "AI Bot的聊天弹窗至少应有Start the chat或Let's chat").toBeTruthy();
          }
        }).toPass({ timeout: 30_000, intervals: [3_000, 5_000, 10_000] });


      });

      await base.step('等待聊天窗口完备', async () => {
        // await aiScroll({ direction: 'down', scrollType: 'untilBottom' }, "AI Bot的聊天弹窗");
        await aiWaitFor('AI Bot的聊天弹窗按顺序有 Order Status、RMA、Parts Availability、Parts Questions、Other Questions', { timeoutMs: waitTimeoutMs });
      });
    };

    await use(openChat);
  },
});

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(DEFAULT_VIEWPORT);
  await page.setExtraHTTPHeaders({ 'User-Agent': DEFAULT_USER_AGENT });
  try {
    await page.goto(DEFAULT_BASE_URL, { waitUntil: 'load',});
  } catch (err) {
    console.warn('goto 超时/失败，继续执行后续步骤', err);
  }
  // await page.waitForLoadState('domcontentloaded');
});