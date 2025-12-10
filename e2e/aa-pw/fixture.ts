import { test as base, type Page } from '@playwright/test';
import { ChatWidget } from './pom/ChatWidget';
import { PartsQuestionPopup } from './pom/PartsQuestionPopup';

type MyFixtures = {
  chatWidget: ChatWidget;
  createPartsQuestionPopup: (page: Page) => PartsQuestionPopup;
};

export const test = base.extend<MyFixtures>({
  chatWidget: async ({ page }, use) => {
    const chatWidget = new ChatWidget(page);
    await use(chatWidget);
  },
  createPartsQuestionPopup: async ({ }, use) => {
    await use((page: Page) => {
        return new PartsQuestionPopup(page);
    });
  },
});

export { expect } from '@playwright/test';
