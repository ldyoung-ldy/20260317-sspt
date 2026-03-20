import { auth } from "@/auth";

export async function getOptionalSession() {
  if (!process.env.AUTH_SECRET?.trim()) {
    return null;
  }

  try {
    return await auth();
  } catch {
    return null;
  }
}
