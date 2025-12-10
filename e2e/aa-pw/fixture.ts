import { test as base, type Page } from '@playwright/test';
import { ChatWidget } from './pom/ChatWidget';
import { PartsQuestionPopup } from './pom/PartsQuestionPopup';
import { getRuntimeConfigFromProject, type RuntimeConfig } from './config/runtime';

type MyFixtures = {
  chatWidget: ChatWidget;
  createPartsQuestionPopup: (page: Page) => PartsQuestionPopup;
  runtimeConfig: RuntimeConfig;
};

export const test = base.extend<MyFixtures>({
  runtimeConfig: async ({}, use, testInfo) => {
    const cfg = getRuntimeConfigFromProject(testInfo.project.name);
    await use(cfg);
  },
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
