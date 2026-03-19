import Link from "next/link";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { getConfiguredAuthProviders } from "@/lib/auth-providers";
import { cn } from "@/lib/utils";

const currentProgress = [
  "Next.js 16 + App Router 脚手架已创建",
  "Prisma schema 已定义完毕",
  "Tailwind v4 与 shadcn/ui 已初始化",
  "Vitest 依赖已安装，当前开始补测试配置",
];

const nextSteps = [
  "完成 Auth.js v5 路由与 OAuth 骨架",
  "接入 Admin 角色自动匹配与 /admin 访问控制",
  "补基础 Header / Admin Sidebar 布局",
  "继续推进 Prisma migrate 与后续赛事管理功能",
];

export default async function Home() {
  const session = await auth();
  const providers = getConfiguredAuthProviders();
  const setupChecklist = [
    {
      label: "DATABASE_URL",
      ready: Boolean(process.env.DATABASE_URL?.trim()),
    },
    {
      label: "OAuth Providers",
      ready: providers.length > 0,
    },
    {
      label: "ADMIN_EMAILS",
      ready: Boolean(process.env.ADMIN_EMAILS?.trim()),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8">
      <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              Step 1 / 项目脚手架进行中（4 / 12）
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">
              AI 赛事业务管理平台 MVP
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              当前已完成基础脚手架、Prisma Schema 和样式系统初始化，正在推进认证、Admin 权限与基础布局。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {session?.user?.role === "ADMIN" ? (
              <Link
                href="/admin"
                className={buttonVariants({ size: "sm" })}
              >
                进入管理后台
              </Link>
            ) : providers.length > 0 ? (
              <Link
                href="/api/auth/signin"
                className={buttonVariants({ size: "sm" })}
              >
                配置完成后登录
              </Link>
            ) : (
              <span className="inline-flex h-7 items-center rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground">
                先补全 OAuth 环境变量
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">当前进度</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {currentProgress.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">环境准备状态</h2>
          <div className="mt-4 space-y-3 text-sm">
            {setupChecklist.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl border border-border px-4 py-3"
              >
                <span>{item.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-xs font-medium",
                    item.ready
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {item.ready ? "已配置" : "待配置"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">下一步实施</h2>
        <ol className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          {nextSteps.map((item, index) => (
            <li key={item} className="rounded-2xl border border-border px-4 py-4">
              <span className="mb-2 block text-xs font-medium text-primary">
                Step {index + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
