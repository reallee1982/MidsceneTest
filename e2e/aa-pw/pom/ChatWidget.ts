import { type Locator, type Page, expect } from '@playwright/test';

export class ChatWidget {
  readonly page: Page;
  readonly minimizedFrame: Locator;
  readonly widgetFrame: Locator;
  readonly openButton: Locator;
  readonly startChatButton: Locator;
  readonly menuItems: Locator;

  constructor(page: Page) {
    this.page = page;
    // Entry point is the minimized iframe; actual chat lives in #chat-widget
    this.minimizedFrame = page.frameLocator('iframe#chat-widget-minimized');
    this.widgetFrame = page.frameLocator('iframe#chat-widget');

    // Button to open chat (blue floating bubble)
    this.openButton = this.minimizedFrame.getByRole('button', { name: /Open LiveChat chat widget/i });

    // Inside the chat window
    this.startChatButton = this.widgetFrame.getByRole('button', { name: /Start the chat/i });

    // Menu items (kept for compatibility; may be unused with new UI)
    this.menuItems = this.widgetFrame.locator('ul, div[role="list"]');
  }

  async openChat() {
    // Wait for minimized bubble to render and open the main chat iframe
    try {
      await this.openButton.first().waitFor({ state: 'visible', timeout: 60000 });
      await this.openButton.first().click();
    } catch (e) {
      console.log("Open button not found or visible within 60s. Checking if already open...");
    }

    // Wait for the chat window to actually open
    await expect(this.widgetFrame.getByRole('button', { name: /Start the chat/i })).toBeVisible({ timeout: 60000 });
  }

  async startChat() {
    // Handle "Start the chat"
    if (await this.startChatButton.isVisible({ timeout: 15000 })) {
      await this.startChatButton.click();
    } else {
      console.log("No start button found, assuming chat already active");
      return;
    }

    // Wait for chat to proceed (fallback to presence of Powered by LiveChat footer)
    await expect(this.widgetFrame.getByRole('button', { name: 'Order Status' })).toBeVisible({ timeout: 30000 });
  }

  async verifyMenuItems(items: string[]) {
    for (const item of items) {
      await expect(this.widgetFrame.getByText(item)).toBeVisible();
    }
  }

  async clickMenuItem(name: string) {
    await this.widgetFrame.getByText(name).click();
  }
}
