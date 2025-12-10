import { test } from '@playwright/test';
import { writeFileSync } from 'fs';
import path from 'path';

test('debug chat widget visibility', async ({ page }) => {
  // Monitor Console
  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  
  // Monitor Network Failures
  page.on('requestfailed', request => {
    console.log(`[Network Failure] ${request.url()} - ${request.failure()?.errorText}`);
  });

  await page.goto('https://npd.test.autobestdevops.com/', { waitUntil: 'load' });

  const outDir = path.join(process.cwd(), 'test-results', 'debug');
  require('fs').mkdirSync(outDir, { recursive: true });

  const dumpFrameButtons = async (name: string) => {
    const f = page.frame({ name });
    if (!f) {
      console.log(`frame ${name} not found`);
      return { buttons: [] as string[] };
    }
    const buttons = await f.getByRole('button').allInnerTexts().catch(() => []);
    console.log(`--- ${name} buttons ---`, buttons);
    return { buttons };
  };

  console.log('Dump before click:');
  await page.waitForSelector('iframe#chat-widget-minimized', { timeout: 15000 }).catch(() => {});
  await dumpFrameButtons('chat-widget-minimized');
  await page.waitForSelector('iframe#chat-widget', { timeout: 15000 }).catch(() => {});
  await dumpFrameButtons('chat-widget');

  // Click main open button inside minimized frame
  const mainButton = page.frameLocator('iframe#chat-widget-minimized').getByRole('button', { name: /Open LiveChat chat widget/i }).first();
  try {
    await mainButton.click({ timeout: 15000 });
    console.log('clicked main chat open button');
  } catch (e) {
    console.log('main button click failed', (e as Error).message);
  }

  // Wait for the main chat iframe to show Start the chat
  const chatFrame = page.frameLocator('iframe#chat-widget');
  try {
    await chatFrame.getByRole('button', { name: /Start the chat/i }).waitFor({ state: 'visible', timeout: 15000 });
    console.log('Start the chat is visible');
  } catch (e) {
    console.log('Start the chat not visible', (e as Error).message);
  }

  await page.waitForTimeout(3000);

  console.log('Dump after click:');
  await page.waitForSelector('iframe#chat-widget', { timeout: 15000 }).catch(() => {});
  await dumpFrameButtons('chat-widget');

  // Try to click Start the chat if present, then dump buttons/texts after waiting
  const startBtn = chatFrame.getByRole('button', { name: /Start the chat/i }).first();
  if (await startBtn.count()) {
    try {
      await startBtn.click({ timeout: 30000 });
      console.log('clicked Start the chat');
    } catch (e) {
      console.log('click Start the chat failed', (e as Error).message);
    }
  }

  await page.waitForTimeout(10000);
  const chatFrameLocator = page.frameLocator('iframe#chat-widget');
  try {
    const buttons = await chatFrameLocator.getByRole('button').allInnerTexts();
    const texts = await chatFrameLocator.locator('*').allInnerTexts();
    console.log('buttons after wait:', buttons);
    console.log('sample texts after wait:', texts.slice(0, 50));

    try {
      writeFileSync(path.join(outDir, 'chat-widget-buttons.txt'), buttons.join('\n'), 'utf8');
      writeFileSync(path.join(outDir, 'chat-widget-texts.txt'), texts.join('\n'), 'utf8');
      try {
        await page.locator('iframe#chat-widget').screenshot({ path: path.join(outDir, 'chat-frame.png') });
      } catch (e) {
        console.log('screenshot failed', (e as Error).message);
      }
    } catch (e) {
      console.log('failed to write files', (e as Error).message);
    }
  } catch (e) {
    console.log('dump buttons/texts failed', (e as Error).message);
  }
});
