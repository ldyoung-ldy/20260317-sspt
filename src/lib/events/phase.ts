type EventPhaseInput = {
  published: boolean;
  registrationStart: Date;
  registrationEnd: Date;
  submissionStart: Date;
  submissionEnd: Date;
  reviewStart: Date;
  reviewEnd: Date;
};

export type EventPhase =
  | "DRAFT"
  | "UPCOMING"
  | "REGISTRATION"
  | "SUBMISSION_PENDING"
  | "SUBMISSION"
  | "REVIEW_PENDING"
  | "REVIEW"
  | "COMPLETED";

export function getEventPhase(event: EventPhaseInput, now = new Date()): EventPhase {
  if (!event.published) {
    return "DRAFT";
  }

  if (now < event.registrationStart) {
    return "UPCOMING";
  }

  if (now < event.registrationEnd) {
    return "REGISTRATION";
  }

  if (now < event.submissionStart) {
    return "SUBMISSION_PENDING";
  }

  if (now < event.submissionEnd) {
    return "SUBMISSION";
  }

  if (now < event.reviewStart) {
    return "REVIEW_PENDING";
  }

  if (now < event.reviewEnd) {
    return "REVIEW";
  }

  return "COMPLETED";
}

export function getEventPhaseLabel(phase: EventPhase) {
  switch (phase) {
    case "DRAFT":
      return "草稿";
    case "UPCOMING":
      return "即将开始";
    case "REGISTRATION":
      return "报名中";
    case "SUBMISSION_PENDING":
      return "待提交";
    case "SUBMISSION":
      return "提交中";
    case "REVIEW_PENDING":
      return "待评审";
    case "REVIEW":
      return "评审中";
    case "COMPLETED":
      return "已结束";
  }
}

export function canRegisterForEvent(
  event: Pick<EventPhaseInput, "published" | "registrationStart" | "registrationEnd">,
  now = new Date()
) {
  return event.published && now >= event.registrationStart && now < event.registrationEnd;
}
