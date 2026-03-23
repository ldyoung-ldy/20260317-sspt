import type { Locator, Page } from "@playwright/test";

type Scope = Locator | Page;

export function fieldControl(scope: Scope, label: string) {
  return scope
    .locator("label", {
      hasText: buildLooseLabelPattern(label),
    })
    .locator("xpath=..")
    .locator("input, textarea, select")
    .first();
}

export function sectionByHeading(scope: Scope, heading: string) {
  return scope.locator("section, article, div").filter({
    has: scope.getByRole("heading", { name: heading }),
  });
}

function buildLooseLabelPattern(label: string) {
  return new RegExp(`^${escapeRegex(label)}(?:\\s*\\*)?$`);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
