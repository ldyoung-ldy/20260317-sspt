export const projectStatuses = ["DRAFT", "FINAL"] as const;

export type ProjectStatusValue = (typeof projectStatuses)[number];

export function isProjectStatus(value: string): value is ProjectStatusValue {
  return projectStatuses.includes(value as ProjectStatusValue);
}

export function getProjectStatusLabel(status: ProjectStatusValue) {
  switch (status) {
    case "DRAFT":
      return "草稿";
    case "FINAL":
      return "终稿";
  }
}
