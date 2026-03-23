import { test, expect } from "../fixtures/test";
import { seedRegistrationSubmissionScenario, shiftEventPhase } from "../helpers/scenarios";
import { fieldControl } from "../helpers/ui";
import { E2E_USERS } from "../helpers/users";

test("选手可以报名、被管理员接受并确认后提交终稿", async ({
  resetState,
  createAuthedPage,
}) => {
  await resetState();
  const event = await seedRegistrationSubmissionScenario();
  const participantPage = await createAuthedPage("participant");

  await participantPage.goto(`/events/${event.slug}/register`);
  await fieldControl(participantPage, "队伍名称（可选）").fill("E2E 冲刺队");
  await fieldControl(participantPage, "团队背景").fill("我们专注于企业效率工具和知识沉淀。");
  await participantPage.getByRole("button", { name: "提交报名" }).click();

  await expect(participantPage).toHaveURL(/\/my\/registrations$/);
  const participantCard = participantPage.locator("article").filter({ hasText: event.name });
  await expect(participantCard).toContainText("待审核");

  const adminPage = await createAuthedPage("admin");
  await adminPage.goto(`/admin/events/${event.id}/registrations`);
  const row = adminPage.locator("tr").filter({ hasText: E2E_USERS.participant.email });
  await row.getByRole("button", { name: "接受" }).click();
  await expect(row).toContainText("已录取");

  await participantPage.goto("/my/registrations");
  await participantCard.getByRole("button", { name: "确认参赛" }).click();
  await expect(participantCard).toContainText("已确认");

  await shiftEventPhase(event.id, "submission");
  await participantPage.goto(`/events/${event.slug}/submit`);
  await fieldControl(participantPage, "作品名称").fill("E2E Submission Copilot");
  await fieldControl(participantPage, "作品描述").fill("自动整理 SOP、沉淀知识卡片并生成交付清单。");
  await fieldControl(participantPage, "参赛赛道").selectOption("效率工具");
  await participantPage.getByText("知识沉淀").click();
  await fieldControl(participantPage, "源码链接").fill("https://github.com/example/e2e-submission-copilot");
  await fieldControl(participantPage, "演示链接").fill("https://demo.example.com/e2e-submission-copilot");
  await participantPage.getByRole("button", { name: "提交终稿" }).click();

  await expect(participantPage.getByRole("button", { name: "更新终稿" })).toBeVisible();
});
