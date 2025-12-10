import { type Locator, type Page, expect } from '@playwright/test';

export class ChatWidget {
  readonly page: Page;
  readonly widgetFrame: Locator;
  readonly openButton: Locator;
  readonly letsChatButton: Locator;
  readonly startChatButton: Locator;
  readonly menuItems: Locator;

  constructor(page: Page) {
    this.page = page;
    // Main chat widget iframe - using src to be robust against title/name changes
    // Matches https://secure.livechatinc.com/...
    this.widgetFrame = page.frameLocator('iframe[src*="livechatinc.com"]');
    
    // Button to open chat
    // Using generic button locator as it's the only button in the frame
    this.openButton = this.widgetFrame.locator('button');
    
    // Inside the chat window
    this.letsChatButton = this.widgetFrame.getByRole('button', { name: "Let's chat" });
    this.startChatButton = this.widgetFrame.getByRole('button', { name: "Start the chat" });
    
    // Menu items
    this.menuItems = this.widgetFrame.locator('ul, div[role="list"]'); 
  }

  async openChat() {
    // Wait longer for the widget to load (network/CDN can be slow)
    try {
      await this.openButton.first().waitFor({ state: 'visible', timeout: 60000 });
      await this.openButton.first().click();
    } catch (e) {
      console.log("Open button not found or visible within 60s. Checking if already open...");
    }

    // Wait for the chat window to actually open
    // Either menu is visible OR start buttons are visible
    await expect(this.widgetFrame.locator('text=Order Status').or(this.letsChatButton).or(this.startChatButton)).toBeVisible({ timeout: 60000 });
  }

  async startChat() {
    // Handle "Let's chat" or "Start the chat"
    if (await this.letsChatButton.isVisible()) {
      await this.letsChatButton.click();
    } else if (await this.startChatButton.isVisible()) {
      await this.startChatButton.click();
    } else {
        console.log("No start button found, assuming menu is visible");
    }
    
    // Wait for menu
    await expect(this.widgetFrame.getByText('Order Status')).toBeVisible();
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

