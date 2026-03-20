import type { RegistrationStatusValue } from "@/lib/registration-status";

export type RegistrationEntryState =
  | { kind: "existing"; status: RegistrationStatusValue }
  | { kind: "can_register" }
  | { kind: "login_required" }
  | { kind: "auth_unavailable" }
  | { kind: "closed" };

export function getRegistrationEntryState(input: {
  currentRegistrationStatus?: RegistrationStatusValue;
  isAuthenticated: boolean;
  registrationOpen: boolean;
  authReady: boolean;
}): RegistrationEntryState {
  if (input.currentRegistrationStatus) {
    return {
      kind: "existing",
      status: input.currentRegistrationStatus,
    };
  }

  if (!input.registrationOpen) {
    return { kind: "closed" };
  }

  if (input.isAuthenticated) {
    return { kind: "can_register" };
  }

  if (!input.authReady) {
    return { kind: "auth_unavailable" };
  }

  return { kind: "login_required" };
}
