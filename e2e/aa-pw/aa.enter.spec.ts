import { test, expect } from './fixture';

const DEFAULT_VIEWPORT = { width: 1280, height: 768 };
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

test.beforeEach(async ({ page, runtimeConfig }) => {
  await page.setViewportSize(DEFAULT_VIEWPORT);
  await page.setExtraHTTPHeaders({ 'User-Agent': DEFAULT_USER_AGENT });
  await page.goto(runtimeConfig.baseURL, { waitUntil: 'load' });
});

test('aa enter', async ({ chatWidget }) => {
  await test.step('打开聊天浮窗', async () => {
    await chatWidget.openChat();
    await chatWidget.startChat();
  });

  await test.step('校验默认菜单可见', async () => {
    await expect(chatWidget.widgetFrame.getByRole('button', { name: 'Order Status' })).toBeVisible();
    await expect(chatWidget.widgetFrame.getByRole('button', { name: 'Parts Questions' })).toBeVisible();
  });
});
