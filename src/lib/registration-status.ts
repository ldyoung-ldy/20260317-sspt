export const registrationStatuses = [
  "PENDING",
  "ACCEPTED",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
] as const;

export type RegistrationStatusValue = (typeof registrationStatuses)[number];

const transitions: Record<RegistrationStatusValue, RegistrationStatusValue[]> = {
  PENDING: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CANCELLED"],
  REJECTED: [],
  CANCELLED: [],
};

export function isRegistrationStatus(value: string): value is RegistrationStatusValue {
  return registrationStatuses.includes(value as RegistrationStatusValue);
}

export function getRegistrationStatusLabel(status: RegistrationStatusValue) {
  switch (status) {
    case "PENDING":
      return "待审核";
    case "ACCEPTED":
      return "已录取";
    case "CONFIRMED":
      return "已确认";
    case "REJECTED":
      return "已拒绝";
    case "CANCELLED":
      return "已取消";
  }
}

export function getAvailableTransitions(status: RegistrationStatusValue) {
  return [...transitions[status]];
}

export function canTransition(
  currentStatus: RegistrationStatusValue,
  nextStatus: RegistrationStatusValue
) {
  return transitions[currentStatus].includes(nextStatus);
}

export function canConfirmRegistration(status: RegistrationStatusValue) {
  return canTransition(status, "CONFIRMED");
}

export function canCancelRegistration(status: RegistrationStatusValue) {
  return canTransition(status, "CANCELLED");
}
