export type AppRole = "USER" | "ADMIN";

const ADMIN_EMAIL_SEPARATOR = /[\s,;]+/;

export function getAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(ADMIN_EMAIL_SEPARATOR)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  return getAdminEmails().has(email.trim().toLowerCase());
}

export function getRoleForEmail(email?: string | null): AppRole {
  return isAdminEmail(email) ? "ADMIN" : "USER";
}
