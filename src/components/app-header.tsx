import Link from "next/link";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { getConfiguredAuthProviders } from "@/lib/auth-providers";
import { getOptionalSession } from "@/lib/auth-session";

function getUserLabel(name?: string | null, email?: string | null) {
  if (name) {
    return name;
  }

  if (email) {
    return email;
  }

  return "已登录用户";
}

export async function AppHeader() {
  const session = await getOptionalSession();
  const providers = getConfiguredAuthProviders();
  const authReady = Boolean(process.env.AUTH_SECRET?.trim()) && providers.length > 0;
  const initials = (session?.user?.name ?? session?.user?.email ?? "U")
    .trim()
    .charAt(0)
    .toUpperCase();
  const linkButtonClassName =
    "inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground transition-colors hover:bg-primary/90";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            AI 赛事业务管理平台
          </Link>

          <nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
            <Link href="/" className="transition-colors hover:text-foreground">
              首页
            </Link>
            {session?.user ? (
              <Link href="/my/registrations" className="transition-colors hover:text-foreground">
                我的报名
              </Link>
            ) : null}
            {session?.user.role === "ADMIN" ? (
              <Link
                href="/admin"
                className="transition-colors hover:text-foreground"
              >
                管理后台
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <div className="hidden items-center gap-3 rounded-full border border-border px-2 py-1 md:flex">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </div>
                <div className="pr-2 text-sm">
                  <div className="font-medium text-foreground">
                    {getUserLabel(session.user.name, session.user.email)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.user.role === "ADMIN" ? "管理员" : "普通用户"}
                  </div>
                </div>
              </div>

              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  退出登录
                </Button>
              </form>
            </>
          ) : authReady ? (
            <Link href="/api/auth/signin" className={linkButtonClassName}>
              登录
            </Link>
          ) : (
            <span className="hidden rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">
              待配置 OAuth
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
