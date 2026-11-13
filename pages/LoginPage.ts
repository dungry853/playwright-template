import { TestPage } from "@/pages/TestPage";

/**
 * Placeholder page object for the app under test. Align the locators with the
 * first application you clone this template for, and delete the class if the
 * app needs no reusable sign-in step.
 */
export class LoginPage extends TestPage {
  async goto(): Promise<void> {
    await super.goto("/login");
  }

  get emailInput() {
    return this.getByLabel(/e-?mail/i);
  }

  get passwordInput() {
    return this.getByLabel(/password/i);
  }

  get submitButton() {
    return this.getByRole("button", { name: /sign in|log in/i });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
