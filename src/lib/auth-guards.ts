import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser(callbackUrl: string) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return session;
}

export async function requireAdmin(callbackUrl = "/admin") {
  const session = await auth();

  if (!session?.user) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return session;
}
