import type { BrowserContext } from "@playwright/test";
import { encode } from "@auth/core/jwt";
import { getE2EBaseUrl, getRequiredEnv } from "./env";
import type { E2EUser } from "./users";

const SESSION_COOKIE_NAME = "authjs.session-token";

export async function buildAuthSessionCookie(user: E2EUser) {
  const secret = getRequiredEnv("AUTH_SECRET");
  const value = await encode({
    secret,
    salt: SESSION_COOKIE_NAME,
    token: {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });

  return {
    name: SESSION_COOKIE_NAME,
    value,
    domain: "127.0.0.1",
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  };
}

export async function signInE2EUser(context: BrowserContext, user: E2EUser) {
  await context.addCookies([await buildAuthSessionCookie(user)]);
}
