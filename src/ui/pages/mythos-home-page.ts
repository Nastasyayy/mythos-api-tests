import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import type { AuthCredentials } from '../../api/auth';
import { env } from '../../config/env';
import { RestAuthModal } from '../components/rest-auth-modal';

export const defaultUiBaseUrl = 'https://api.qasandbox.ru/';

export const getUiBaseUrl = (): string => env.uiBaseUrl ?? defaultUiBaseUrl;

export class MythosHomePage {
  readonly page: Page;

  readonly authModal: RestAuthModal;

  readonly restTabButton: Locator;

  readonly sandboxTabButton: Locator;

  readonly loginButton: Locator;

  readonly logoutButton: Locator;

  readonly createEntityButton: Locator;

  readonly createEntityModal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.authModal = new RestAuthModal(page);
    this.restTabButton = page.getByRole('button', { name: /REST API/i });
    this.sandboxTabButton = page.getByRole('button', {
      name: /\u041f\u0435\u0441\u043e\u0447\u043d\u0438\u0446\u0430/i,
    });
    this.loginButton = page.locator('main').getByRole('button', {
      name: '\u0412\u043e\u0439\u0442\u0438',
    });
    this.logoutButton = page.getByRole('button', { name: '\u0412\u044b\u0439\u0442\u0438' });
    this.createEntityButton = page.getByRole('button', {
      name: '\u041f\u0440\u0438\u0437\u0432\u0430\u0442\u044c \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u043e',
    });
    this.createEntityModal = page.locator('#modal-create');
  }

  async goto(): Promise<void> {
    await this.page.goto(getUiBaseUrl(), { waitUntil: 'domcontentloaded' });
    await expect(this.restTabButton).toBeVisible();
    await expect(this.sandboxTabButton).toBeVisible();
  }

  async openRestSandbox(): Promise<void> {
    await this.restTabButton.click();
    await this.sandboxTabButton.click();
    await expect(this.createEntityButton).toBeVisible();
  }

  async openLoginModal(): Promise<void> {
    await this.loginButton.click();
    await expect(this.authModal.usernameInput).toBeVisible();
  }

  async loginAs(credentials: AuthCredentials): Promise<void> {
    await this.openLoginModal();
    await this.authModal.login(credentials);
  }

  async expectAuthenticated(): Promise<void> {
    await expect(this.logoutButton).toBeVisible();
    await expect(this.loginButton).toBeHidden();
  }

  async openCreateEntityModal(): Promise<void> {
    await this.createEntityButton.click();
    await expect(this.createEntityModal).toHaveClass(/active/);
  }

  async expectRestTokenStored(): Promise<void> {
    const restToken = await this.page.evaluate(
      () =>
        (
          globalThis as {
            localStorage: { getItem: (key: string) => string | null };
          }
        ).localStorage.getItem('mythos_rest_token'),
    );
    expect(restToken).toBeTruthy();
  }
}
