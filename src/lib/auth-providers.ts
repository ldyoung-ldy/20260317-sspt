import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

const PLACEHOLDER_PREFIXES = ["YOUR_", "replace-with-"];

function isConfiguredEnvValue(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  return !PLACEHOLDER_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function hasOAuthCredentials(clientId: string | undefined, clientSecret: string | undefined) {
  return isConfiguredEnvValue(clientId) && isConfiguredEnvValue(clientSecret);
}

export function getConfiguredAuthProviders() {
  const providers = [];

  if (hasOAuthCredentials(process.env.AUTH_GITHUB_ID, process.env.AUTH_GITHUB_SECRET)) {
    providers.push({ id: "github", name: "GitHub" } as const);
  }

  if (hasOAuthCredentials(process.env.AUTH_GOOGLE_ID, process.env.AUTH_GOOGLE_SECRET)) {
    providers.push({ id: "google", name: "Google" } as const);
  }

  return providers;
}

export function getAuthProviders() {
  const providers = [];

  if (hasOAuthCredentials(process.env.AUTH_GITHUB_ID, process.env.AUTH_GITHUB_SECRET)) {
    providers.push(
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
      })
    );
  }

  if (hasOAuthCredentials(process.env.AUTH_GOOGLE_ID, process.env.AUTH_GOOGLE_SECRET)) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      })
    );
  }

  return providers;
}
