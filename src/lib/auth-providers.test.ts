import { afterEach, describe, expect, it } from "vitest";
import { getConfiguredAuthProviders } from "@/lib/auth-providers";

const originalGithubId = process.env.AUTH_GITHUB_ID;
const originalGithubSecret = process.env.AUTH_GITHUB_SECRET;
const originalGoogleId = process.env.AUTH_GOOGLE_ID;
const originalGoogleSecret = process.env.AUTH_GOOGLE_SECRET;

afterEach(() => {
  if (originalGithubId === undefined) {
    delete process.env.AUTH_GITHUB_ID;
  } else {
    process.env.AUTH_GITHUB_ID = originalGithubId;
  }

  if (originalGithubSecret === undefined) {
    delete process.env.AUTH_GITHUB_SECRET;
  } else {
    process.env.AUTH_GITHUB_SECRET = originalGithubSecret;
  }

  if (originalGoogleId === undefined) {
    delete process.env.AUTH_GOOGLE_ID;
  } else {
    process.env.AUTH_GOOGLE_ID = originalGoogleId;
  }

  if (originalGoogleSecret === undefined) {
    delete process.env.AUTH_GOOGLE_SECRET;
  } else {
    process.env.AUTH_GOOGLE_SECRET = originalGoogleSecret;
  }
});

describe("auth-providers", () => {
  it("does not expose providers when env vars still contain sample placeholders", () => {
    process.env.AUTH_GITHUB_ID = "YOUR_GITHUB_CLIENT_ID_HERE";
    process.env.AUTH_GITHUB_SECRET = "YOUR_GITHUB_CLIENT_SECRET_HERE";
    process.env.AUTH_GOOGLE_ID = "replace-with-google-client-id";
    process.env.AUTH_GOOGLE_SECRET = "replace-with-google-client-secret";

    expect(getConfiguredAuthProviders()).toEqual([]);
  });

  it("exposes only providers with real configured credentials", () => {
    process.env.AUTH_GITHUB_ID = "github-client-id";
    process.env.AUTH_GITHUB_SECRET = "github-client-secret";
    process.env.AUTH_GOOGLE_ID = "YOUR_GOOGLE_CLIENT_ID_HERE";
    process.env.AUTH_GOOGLE_SECRET = "YOUR_GOOGLE_CLIENT_SECRET_HERE";

    expect(getConfiguredAuthProviders()).toEqual([{ id: "github", name: "GitHub" }]);
  });
});
