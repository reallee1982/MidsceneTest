import { test } from './fixture';

test('aa enter', async ({ openChat, aiAssert }) => {
  await openChat();

  await test.step('校验AA窗口状态', async () => {
    await aiAssert('Ai Bot的聊天弹窗按顺序有 Order Status、RMA、Parts Availability、Parts Questions、Other Questions');
  });
});
