type EventDeletionPolicyInput = {
  published: boolean;
  registrationsCount: number;
  projectsCount: number;
  projectScoresCount: number;
  judgesCount: number;
};

export function getEventDeletionBlockReason(input: EventDeletionPolicyInput) {
  if (input.published) {
    return "已发布赛事请先取消发布，再执行删除。";
  }

  if (
    input.registrationsCount > 0 ||
    input.projectsCount > 0 ||
    input.projectScoresCount > 0 ||
    input.judgesCount > 0
  ) {
    return "已有报名、作品、评分或评委分配数据的赛事不可删除。";
  }

  return null;
}

export function canDeleteEvent(input: EventDeletionPolicyInput) {
  return getEventDeletionBlockReason(input) === null;
}
