import { test, expect, type Page, type FrameLocator, type Locator } from '@playwright/test';

const BASE_URL = 'https://hpn.dev.autobestdevops.com/';
const DEFAULT_VIEWPORT = { width: 1280, height: 768 };
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

const VIN = '1HGCE1724TA000210';
const FIRST_QUESTION =
  "Hello, I'm looking for replacement license plate bolts and grommets. Could you please send me in the right direction? Thank you";
const PART_NUMBER = '80201-SV4-A01';
const FITMENT_QUESTION = `What about this part number: ${PART_NUMBER} ,is it fit my car?`;

class ChatWidgetPO {
  readonly page: Page;
  readonly minimizedFrame: FrameLocator;
  readonly widgetFrame: FrameLocator;
  readonly openButton: Locator;
  readonly startChatButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.minimizedFrame = page.frameLocator('iframe#chat-widget-minimized, iframe[name="chat-widget-minimized"]');
    this.widgetFrame = page.frameLocator('iframe#chat-widget, iframe[name="chat-widget"]');
    this.openButton = this.minimizedFrame.getByRole('button', { name: /Open LiveChat chat widget/i });
    this.startChatButton = this.widgetFrame.getByRole('button', { name: /Start the chat|Let's chat/i });
  }

  async openChat() {
    await test.step('打开聊天浮窗', async () => {
      try {
        await this.openButton.first().waitFor({ state: 'visible', timeout: 60_000 });
        await this.openButton.first().click();
      } catch {
        // Chat may already be open.
      }
      await expect(this.startChatButton.first()).toBeVisible({ timeout: 60_000 });
    });
  }

  async startChat() {
    await test.step('开始聊天', async () => {
      if (await this.startChatButton.isVisible({ timeout: 15_000 })) {
        await this.startChatButton.click();
      }
      await expect(this.widgetFrame.getByRole('button', { name: 'Parts Questions' })).toBeVisible({ timeout: 30_000 });
    });
  }

  async openPartsQuestionsPopup(): Promise<Page> {
    return await test.step('从聊天入口打开 Parts Questions 弹窗', async () => {
      const [popup] = await Promise.all([
        this.page.waitForEvent('popup'),
        this.widgetFrame.getByRole('button', { name: 'Parts Questions' }).click(),
      ]);
      await popup.waitForLoadState('domcontentloaded');
      return popup;
    });
  }
}

class PartsQuestionsPopupPO {
  readonly page: Page;
  readonly vinInput: Locator;
  readonly partNumberInput: Locator;
  readonly questionInput: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.vinInput = page.getByPlaceholder('Enter the VIN of Your Vehicle');
    this.partNumberInput = page.getByPlaceholder('Enter Part Number');
    this.questionInput = page.getByRole('textbox', { name: /Enter Your Questions/i });
    this.continueButton = page.getByRole('button', { name: /Continue/i });
  }

  async enterVIN(vin: string) {
    await test.step(`输入 VIN: ${vin}`, async () => {
      await expect(this.vinInput).toBeVisible();
      await this.vinInput.fill(vin);
      await this.continueButton.click();
    });
  }

  async verifyVehicleContext(vin: string) {
    await test.step('校验 VIN 已生效并显示菜单', async () => {
      await expect(this.page.getByText(new RegExp(`\\(Vin: ${vin}\\)`))).toBeVisible();
      await expect(this.page.getByText('Please select a subtopic.')).toBeVisible();
      await expect(this.page.getByRole('button', { name: 'Parts Questions' })).toBeVisible();
    });
  }

  async selectPartsQuestionsSubtopic() {
    await test.step('选择 Parts Questions 子主题', async () => {
      await this.page.getByRole('button', { name: 'Parts Questions' }).click();
      await expect(this.partNumberInput).toBeVisible();
      await expect(this.questionInput).toBeVisible();
    });
  }

  async submitQuestion(question: string, partNumber?: string) {
    await test.step(`提交问题: ${question}`, async () => {
      if (partNumber) {
        await this.partNumberInput.fill(partNumber);
      }
      await this.questionInput.fill(question);

      const waitDispatch = this.page.waitForResponse(
        (res) => res.url().includes('/pq/dispatch') && res.request().method() === 'POST',
      );

      await this.continueButton.click();
      await waitDispatch.catch(() => undefined);
    });
  }

  async verifyFirstSearchResults() {
    await test.step('校验首次查询结果', async () => {
      // await expect(this.page.getByText("Hello, I'm looking for")).toBeVisible();
      await expect(this.page.getByText('Based on ').first()).toBeVisible({timeout: 50000});
      await expect(this.page.getByText('Mfg.Origin:USA').first()).toBeVisible();
      await expect(this.page.locator('.pq-show-image-img').first()).toBeVisible();
      await expect(this.page.locator('.pq-find-result-diagram').first()).toBeVisible();

      const viewDetails = this.page.getByText('View Product Details');
      await expect.poll(() => viewDetails.count()).toBeGreaterThan(1);

      await expect(this.page.getByText('Do these results answer your')).toBeVisible();
      await expect(this.page.getByRole('button', { name: /No, I need further assistance/i })).toBeVisible();
      await expect(this.page.getByRole('button', { name: /Yes, but I have other parts/i })).toBeVisible();
      await expect(this.page.getByRole('button', { name: /Yes, complete this chat/i })).toBeVisible();
    });
  }

  async chooseFurtherAssistance() {
    await test.step('选择需要进一步协助', async () => {
      await this.page.getByRole('button', { name: /No, I need further assistance/i }).click();
      await expect(this.page.getByRole('button', { name: 'Part Fitment' })).toBeVisible();
    });
  }

  async verifyFitmentResult(partNumber: string) {
    await test.step(`校验零件适配结果: ${partNumber}`, async () => {
      await expect(this.page.getByRole('button', { name: /Ask other parts questions/i })).toBeVisible({ timeout: 30_000 });
      await expect(this.page.getByText(new RegExp(`Part ${partNumber} fits your`, 'i'))).toBeVisible();
      await this.page.getByText(new RegExp(`Part ${partNumber} fits your`, 'i')).click();

      await expect(this.page.locator('#root')).toContainText(`Honda ${partNumber}`);
      await expect(this.page.locator('#root')).toContainText('$');
      await expect(this.page.locator('.pq-dp-result > .pq-find-result-price-w > .pq-find-result-view')).toBeVisible();
      await expect(this.page.getByRole('button', { name: /Ask other parts questions/i })).toBeVisible();
      await expect(this.page.getByRole('button', { name: /Complete this chat/i })).toBeVisible();
    });
  }
}

test.describe('HPN Dev - Parts Questions flow', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'hpn-dev', 'Only runs on hpn-dev project');
    await page.setViewportSize(DEFAULT_VIEWPORT);
    await page.setExtraHTTPHeaders({ 'User-Agent': DEFAULT_USER_AGENT });
    await page.goto(BASE_URL, { waitUntil: 'load' });
  });

  test('vin -> parts question -> fitment -> part details', async ({ page }) => {
    const chatWidget = new ChatWidgetPO(page);

    await chatWidget.openChat();
    await chatWidget.startChat();

    const popup = await chatWidget.openPartsQuestionsPopup();
    const pqPopup = new PartsQuestionsPopupPO(popup);

    await pqPopup.enterVIN(VIN);
    await pqPopup.verifyVehicleContext(VIN);
    await pqPopup.selectPartsQuestionsSubtopic();

    await pqPopup.submitQuestion(FIRST_QUESTION);
    await pqPopup.verifyFirstSearchResults();
    await pqPopup.chooseFurtherAssistance();

    await pqPopup.selectPartsQuestionsSubtopic();
    await pqPopup.submitQuestion(FITMENT_QUESTION, PART_NUMBER);
    await pqPopup.verifyFitmentResult(PART_NUMBER);

    await popup.close();
  });
});
