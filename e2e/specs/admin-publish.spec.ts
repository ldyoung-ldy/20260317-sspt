import { test, expect } from "../fixtures/test";
import { fieldControl } from "../helpers/ui";

test("管理员可以创建赛事、发布并在前台看到", async ({ resetState, createAuthedPage }) => {
  await resetState();
  const page = await createAuthedPage("admin");
  const eventName = `E2E 发布赛事 ${Date.now()}`;

  await page.goto("/admin/events/new");
  await fieldControl(page, "赛事名称").fill(eventName);
  await fieldControl(page, "赛事描述").fill("用于验证管理员创建、发布和前台可见的自动化测试赛事。");
  await page.getByRole("button", { name: "创建赛事" }).click();

  await expect(page).toHaveURL(/\/admin\/events$/);

  const row = page.locator("tr").filter({ hasText: eventName });
  await expect(row).toContainText("草稿");
  await row.getByRole("button", { name: "发布" }).click();
  await expect(row).toContainText("已发布");

  await row.getByRole("link", { name: "预览" }).click();
  await expect(page.getByRole("heading", { name: eventName })).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("link", { name: new RegExp(eventName) })).toBeVisible();
});
