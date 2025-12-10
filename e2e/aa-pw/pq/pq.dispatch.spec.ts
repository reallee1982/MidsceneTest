import { test, expect } from '../fixture';

const DEFAULT_BASE_URL = 'https://npd.test.autobestdevops.com';
const DEFAULT_VIEWPORT = { width: 1280, height: 768 };
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

const PART_NUMBER = '15200-EN20A';
const QUESTION = 'is it fit my car?';
const VIN = 'JN8AZ2KR0ET350093';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(DEFAULT_VIEWPORT);
  await page.setExtraHTTPHeaders({ 'User-Agent': DEFAULT_USER_AGENT });
  await page.goto(DEFAULT_BASE_URL, { waitUntil: 'load' });
});

test('dispatch', async ({ page, chatWidget, createPartsQuestionPopup }) => {
  await test.step('Open Chat and verify menu', async () => {
    await chatWidget.openChat();
    await chatWidget.startChat();
    await expect(chatWidget.widgetFrame.getByRole('button', { name: 'Parts Questions' })).toBeVisible();
  });

  await test.step('Parts Questions Flow', async () => {
    // Click 'Parts Questions' and wait for popup
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      chatWidget.clickMenuItem('Parts Questions')
    ]);

    await popup.waitForLoadState('domcontentloaded');
    console.log('Popup URL:', popup.url());

    const popupPO = createPartsQuestionPopup(popup);

    // Enter VIN
    await popupPO.enterVIN(VIN);
    await popupPO.clickContinue();

    // Validate Vehicle Info
    await popupPO.verifyVehicleInfo(VIN);

    // Click Parts Questions inside popup (if it exists as a second step)
    // The original script says: await popupAgent.aiTap("Parts Questions", ...);
    await popupPO.selectPartsQuestions();

    // Verify Form
    await popupPO.verifyQuestionForm();

    // Fill Form
    await popupPO.fillQuestionForm(QUESTION, PART_NUMBER);
    await popupPO.verifyInputContent(QUESTION, PART_NUMBER);

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
    expect(extractBody?.data?.inputPartNumber).toBe(PART_NUMBER);

    expect(dispatchRes.status()).toBe(200);
    const dispatchBody = await dispatchRes.json();
    expect(dispatchBody?.data?.partLegal).toBe(true);
    expect(dispatchBody?.data?.partDetail?.partNumber).toBe(PART_NUMBER);

    // Verify UI Result
    await popupPO.verifyResult(PART_NUMBER);
  });
});
