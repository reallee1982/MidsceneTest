import { type Locator, type Page, expect } from '@playwright/test';

export class PartsQuestionPopup {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async enterVIN(vin: string) {
    // Robust locator strategy: Find the label text, then the input
    // Attempt to find input by placeholder first if possible
    const input = this.page.getByPlaceholder('Enter VIN', { exact: false })
      .or(this.page.locator('input[name="vin"]')) // Common name
      .or(this.page.locator('input').filter({ hasText: '' })); // Fallback to generic input if it's the only one visible? 
      
    // Better strategy based on AI prompt hint:
    // "In order to answer..." is likely a description above the input.
    // We can try to get the input below it.
    await expect(this.page.getByText('In order to answer your question')).toBeVisible();
    
    // Try to find a textbox
    const vinInput = this.page.getByRole('textbox').first(); 
    await vinInput.fill(vin);
  }

  async clickContinue() {
    await this.page.getByRole('button', { name: 'continue', exact: false }).click();
  }

  async verifyVehicleInfo(vin: string) {
    await expect(this.page.getByText(`Vin: ${vin}`)).toBeVisible();
    await expect(this.page.getByText('Vehicle Information')).toBeVisible();
    await expect(this.page.getByText('Part Fitment')).toBeVisible();
    await expect(this.page.getByText('Parts Questions')).toBeVisible();
  }

  async selectPartsQuestions() {
    await this.page.getByText('Parts Questions').click();
  }

  async verifyQuestionForm() {
    await expect(this.page.getByText('Please enter your question and part number')).toBeVisible();
  }

  async fillQuestionForm(question: string, partNumber: string) {
    // Inputs
    await this.page.getByPlaceholder('Enter Your Questions', { exact: false }).fill(question);
    await this.page.getByPlaceholder('Enter Part Number', { exact: false }).fill(partNumber);
  }

  async verifyInputContent(question: string, partNumber: string) {
     await expect(this.page.getByPlaceholder('Enter Your Questions', { exact: false })).toHaveValue(question);
     await expect(this.page.getByPlaceholder('Enter Part Number', { exact: false })).toHaveValue(partNumber);
  }

  async submitForm() {
    // "continue" is used in the AI prompt for submission too?
    // "if (await popupAgent.aiBoolean("continue可见")) ..."
    const continueBtn = this.page.getByRole('button', { name: 'continue', exact: false });
    if (await continueBtn.isVisible()) {
        await continueBtn.click();
    }
  }

  async verifyResult(partNumber: string) {
     await expect(this.page.getByText(`Part ${partNumber} fits your vehicle`)).toBeVisible();
     await expect(this.page.getByText('Description')).toBeVisible();
     // Check for buttons
     await expect(this.page.getByRole('button', { name: 'Ask other parts questions' })).toBeVisible();
     await expect(this.page.getByRole('button', { name: 'Complete this Chat' })).toBeVisible();
  }
}
