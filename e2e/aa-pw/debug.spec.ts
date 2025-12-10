import { test } from '@playwright/test';

test('debug chat widget visibility', async ({ page }) => {
  // Monitor Console
  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  
  // Monitor Network Failures
  page.on('requestfailed', request => {
    console.log(`[Network Failure] ${request.url()} - ${request.failure()?.errorText}`);
  });

  await page.goto('https://npd.dev.autobestdevops.com/', { waitUntil: 'load' });
  
  const iframe = page.frameLocator('iframe#chat-widget');
  const button = iframe.locator('button').first();
  const labeledButton = iframe.getByLabel('Open LiveChat chat widget');

  console.log('Waiting for iframe...');
  await iframe.locator(':root').waitFor({ state: 'attached' });
  console.log('Iframe attached.');

  console.log('Waiting for any button in iframe...');
  try {
      await iframe.locator('button').first().waitFor({ state: 'attached', timeout: 20000 });
      console.log('Button attached!');
  } catch (e) {
      console.log('Button NOT attached within 20s');
      
      console.log('Dumping all iframes...');
      const frames = page.frames();
      for (const f of frames) {
          console.log(`Frame: name="${f.name()}", title="${await f.title()}", url="${f.url()}"`);
          try {
             // Try to print body length to see if it has content
             const content = await f.content();
             console.log(`  Content length: ${content.length}`);
             if (f.url().includes('livechatinc')) {
                 console.log('--- LiveChat Frame Content ---');
                 console.log(content);
                 console.log('------------------------------');
             }
          } catch (err) {
             console.log(`  Access denied to content`);
          }
      }
  }

  console.log('Checking generic button count...');
  const count = await iframe.locator('button').count();
  console.log(`Button count: ${count}`);

  if (count > 0) {
      console.log('Checking generic button visibility...');
      const isVisible = await button.isVisible();
      console.log(`Generic button isVisible: ${isVisible}`);
      
      if (!isVisible) {
          console.log('Checking bounding box...');
          const box = await button.boundingBox();
          console.log(`Bounding box: ${JSON.stringify(box)}`);
          
          console.log('Checking computed style...');
          const style = await button.evaluate((el) => {
              const s = window.getComputedStyle(el);
              return { display: s.display, visibility: s.visibility, opacity: s.opacity };
          });
          console.log(`Style: ${JSON.stringify(style)}`);
      }
  }

  console.log('Checking labeled button visibility...');
  const isLabeledVisible = await labeledButton.isVisible();
  console.log(`Labeled button isVisible: ${isLabeledVisible}`);
});
