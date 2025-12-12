import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://hpn.dev.autobestdevops.com/');
  await expect(page.locator('iframe[name="chat-widget-minimized"]').contentFrame().getByRole('button', { name: 'Open LiveChat chat widget' })).toBeVisible();
  await expect(page.locator('iframe[name="chat-widget-minimized"]').contentFrame().getByRole('button', { name: 'Open LiveChat chat widget' })).toBeVisible();
  await page.locator('iframe[name="chat-widget-minimized"]').contentFrame().getByRole('button', { name: 'Open LiveChat chat widget' }).click();

  await expect(page.locator('iframe[name="chat-widget"]').contentFrame().getByRole('button', { name: 'Start the chat' })).toBeVisible();
  await page.locator('iframe[name="chat-widget"]').contentFrame().getByRole('button', { name: 'Start the chat' }).click();
  await expect(page.locator('iframe[name="chat-widget"]').contentFrame().getByRole('button', { name: 'Parts Questions' })).toBeVisible();
  const page1Promise = page.waitForEvent('popup');
  await page.locator('iframe[name="chat-widget"]').contentFrame().getByRole('button', { name: 'Parts Questions' }).click();
  const page1 = await page1Promise;
  await expect(page1.getByText('Hi! I\'m your assistant. I\'m')).toBeVisible();
  await expect(page1.locator('.ab-input')).toBeVisible();
  await page1.getByPlaceholder('Enter the VIN of Your Vehicle').click();
  await page1.getByPlaceholder('Enter the VIN of Your Vehicle').fill('1HGCE1724TA000210');
  await page1.getByRole('button', { name: 'Continue' }).click();
  await expect(page1.getByText('(Vin: 1HGCE1724TA000210)')).toBeVisible();
  await expect(page1.getByText('Please select a subtopic.')).toBeVisible();
  await expect(page1.getByRole('button', { name: 'Parts Questions' })).toBeVisible();
  await page1.getByRole('button', { name: 'Parts Questions' }).click();
  await expect(page1.getByPlaceholder('Enter Part Number')).toBeVisible();
  await expect(page1.getByRole('textbox', { name: 'Enter Your Questions' })).toBeVisible();
  await page1.getByRole('textbox', { name: 'Enter Your Questions' }).click();
  await page1.getByRole('textbox', { name: 'Enter Your Questions' }).fill('Hello, I\'m looking for replacement license plate bolts and grommets. Could you please send me in the right direction? Thank you');
  await page1.getByRole('button', { name: 'Continue' }).click();
  await expect(page1.getByText('Hello, I\'m looking for')).toBeVisible();
  await expect(page1.getByText('Based on ')).toBeVisible({timeout:50000});
  await expect(page1.getByText('Mfg.Origin:USA').first()).toBeVisible();
  await expect(page1.locator('.pq-show-image-img').first()).toBeVisible();
  await expect(page1.locator('.pq-find-result-diagram').first()).toBeVisible();
 
  await expect((await page1.getByText('View Product Details').count()).valueOf()).toBeGreaterThan(1);
  await expect(page1.getByText('Do these results answer your')).toBeVisible();
  await expect(page1.getByRole('button', { name: 'No, I need further assistance' })).toBeVisible();
  await expect(page1.getByRole('button', { name: 'Yes, but I have other parts' })).toBeVisible();
  await expect(page1.getByRole('button', { name: 'Yes, complete this chat' })).toBeVisible();
  await page1.getByText('No, I need further assistance from dealer parts specialistYes, but I have other').click();
  await expect(page1.getByRole('button', { name: 'Part Fitment' })).toBeVisible();

  await page1.getByRole('button', { name: 'Parts Questions' }).click();
  await expect(page1.getByRole('textbox', { name: 'Enter Your Questions' })).toBeVisible();

  await page1.getByPlaceholder('Enter Part Number').click();
  await page1.getByPlaceholder('Enter Part Number').fill('80201-SV4-A01');
  await page1.getByRole('textbox', { name: 'Enter Your Questions' }).click();
  await page1.getByRole('textbox', { name: 'Enter Your Questions' }).fill('What about this part number: 80201-SV4-A01  ,is it fit my car?');
  await page1.getByRole('button', { name: 'Continue' }).click();
  await expect(page1.getByRole('button', { name: 'Ask other parts questions' })).toBeVisible({timeout:30000});

  await page1.getByText('Part 80201-SV4-A01 fits your').click();
  await expect(page1.locator('#root')).toContainText('Honda 80201-SV4-A01 Case, Evaporator (Upper)');
  await expect(page1.locator('#root')).toContainText('$15.80');
  await expect(page1.locator('.pq-dp-result > .pq-find-result-price-w > .pq-find-result-view')).toBeVisible();
  await expect(page1.getByRole('button', { name: 'Ask other parts questions' })).toBeVisible();
  await expect(page1.getByRole('button', { name: 'Complete this chat' })).toBeVisible();
  // await expect(page1.locator('#root')).toMatchAriaSnapshot(`
  //   - text: /Part \\d+-SV4-A01 fits your vehicle Honda \\d+-SV4-A01 Case, Evaporator \\(Upper\\)/
  //   - paragraph: "Part Description: Evaporator Case"
  //   - paragraph: "Mfg.Origin: USA"
  //   - strong: /\\$\\d+\\.\\d+/
  //   - text: View Product Details
  //   `);
});