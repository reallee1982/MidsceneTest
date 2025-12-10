import { test, expect } from '../fixture';

const DEFAULT_VIEWPORT = { width: 1280, height: 768 };
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

test.beforeEach(async ({ page, runtimeConfig }) => {
  await page.setViewportSize(DEFAULT_VIEWPORT);
  await page.setExtraHTTPHeaders({ 'User-Agent': DEFAULT_USER_AGENT });
  await page.goto(runtimeConfig.baseURL, { waitUntil: 'load' });
});

test('dispatch', async ({ page, chatWidget, createPartsQuestionPopup, runtimeConfig }) => {
  await test.step('Open Chat and verify menu', async () => {
    await chatWidget.openChat();
    await chatWidget.startChat();
    await expect(chatWidget.widgetFrame.getByRole('button', { name: 'Parts Questions' })).toBeVisible();
  });

  for (const data of runtimeConfig.data) {
    await test.step(`Parts Questions Flow for vin: ${data.VIN}, part: ${data.PART_NUMBER}, question: ${data.QUESTION}`, async () => {
      // Click 'Parts Questions' and wait for popup
      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        chatWidget.clickMenuItem('Parts Questions')
      ]);

      await popup.waitForLoadState('domcontentloaded');
      console.log('Popup URL:', popup.url());

      const popupPO = createPartsQuestionPopup(popup);

      // Enter VIN
      await popupPO.enterVIN(data.VIN);
      await popupPO.clickContinue();

      // Validate Vehicle Info
      await popupPO.verifyVehicleInfo(data.VIN);

      // Click Parts Questions inside popup (if it exists as a second step)
      await popupPO.selectPartsQuestions();

      // Verify Form
      await popupPO.verifyQuestionForm();

      // Fill Form
      await popupPO.fillQuestionForm(data.QUESTION, data.PART_NUMBER);
      await popupPO.verifyInputContent(data.QUESTION, data.PART_NUMBER);

      // Setup Network Interception
      const waitExtract = popup.waitForResponse(
        (res) => res.url().includes('/pq/extractPartNumber') && res.request().method() === 'POST'
      );
      const waitDispatch = popup.waitForResponse(
        (res) => res.url().includes('/pq/dispatch') && res.request().method() === 'POST'
      );

      // Submit
      await popupPO.submitForm();

      // Wait for network responses
      const [extractRes, dispatchRes] = await Promise.all([waitExtract, waitDispatch]);

      // Validate API
      expect(extractRes.status()).toBe(200);
      const extractBody = await extractRes.json();
      expect(extractBody?.data?.partLegal).toBe(true);
      expect(extractBody?.data?.inputPartNumber).toBe(data.PART_NUMBER);

      expect(dispatchRes.status()).toBe(200);
      const dispatchBody = await dispatchRes.json();
      expect(dispatchBody?.data?.partLegal).toBe(true);
      expect(dispatchBody?.data?.partDetail?.partNumber).toBe(data.PART_NUMBER);

      // Verify UI Result
      await popupPO.verifyResult(data.PART_NUMBER);
    });
  }
});
