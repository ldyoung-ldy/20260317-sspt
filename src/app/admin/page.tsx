import { getOptionalSession } from "@/lib/auth-session";

const checkpoints = [
  {
    title: "认证与角色",
    description: "Auth.js、OAuth provider、ADMIN_EMAILS 自动角色匹配。",
  },
  {
    title: "赛事管理",
    description: "创建赛事、编辑时间窗口、发布前台可见内容。",
  },
  {
    title: "后续模块",
    description: "报名审核、作品提交、评分与排名将按 Step 2-6 推进。",
  },
];

export default async function AdminDashboardPage() {
  const session = await getOptionalSession();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Admin Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          你好，{session?.user.name ?? session?.user.email ?? "管理员"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          当前后台已完成基础入口、访问保护与导航骨架。接下来优先补赛事 CRUD、报名流转和作品/评分模块。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {checkpoints.map((item) => (
          <article
            key={item.title}
            className="rounded-3xl border border-border bg-card p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
