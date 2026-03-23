export type E2EUserRole = "ADMIN" | "USER";

export type E2EUser = {
  id: string;
  email: string;
  name: string;
  role: E2EUserRole;
};

export const E2E_USERS = {
  admin: {
    id: "e2e-admin-user",
    email: "admin-e2e@example.com",
    name: "E2E Admin",
    role: "ADMIN",
  },
  participant: {
    id: "e2e-participant-user",
    email: "participant-e2e@example.com",
    name: "E2E Participant",
    role: "USER",
  },
  participantTwo: {
    id: "e2e-participant-two-user",
    email: "participant-two-e2e@example.com",
    name: "E2E Participant Two",
    role: "USER",
  },
  judgeOne: {
    id: "e2e-judge-one-user",
    email: "judge-one-e2e@example.com",
    name: "E2E Judge One",
    role: "USER",
  },
  judgeTwo: {
    id: "e2e-judge-two-user",
    email: "judge-two-e2e@example.com",
    name: "E2E Judge Two",
    role: "USER",
  },
} satisfies Record<string, E2EUser>;

export type E2EUserKey = keyof typeof E2E_USERS;
