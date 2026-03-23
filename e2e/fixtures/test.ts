import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { signInE2EUser } from "../helpers/auth";
import { resetAndSeedCoreUsers } from "../helpers/db";
import { getE2EBaseUrl } from "../helpers/env";
import { E2E_USERS, type E2EUserKey } from "../helpers/users";

type E2EFixtures = {
  resetState: () => Promise<void>;
  createAuthedPage: (userKey: E2EUserKey) => Promise<Page>;
};

export const test = base.extend<E2EFixtures>({
  resetState: async ({}, runFixture) => {
    await runFixture(async () => {
      await resetAndSeedCoreUsers();
    });
  },
  createAuthedPage: async ({ browser }, runFixture) => {
    const contexts: BrowserContext[] = [];

    await runFixture(async (userKey) => {
      const context = await browser.newContext({
        baseURL: getE2EBaseUrl(),
      });
      contexts.push(context);
      await signInE2EUser(context, E2E_USERS[userKey]);
      return context.newPage();
    });

    await Promise.all(contexts.map((context) => context.close()));
  },
});

export { expect } from "@playwright/test";
