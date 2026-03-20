import Link from "next/link";
import { getConfiguredAuthProviders } from "@/lib/auth-providers";
import { getOptionalSession } from "@/lib/auth-session";
import { EventPhaseBadge } from "@/components/events/event-phase-badge";
import { linkButtonClassName } from "@/lib/button-link";
import { listPublishedEvents } from "@/lib/events/queries";

export default async function Home() {
  const session = await getOptionalSession();
  const providers = getConfiguredAuthProviders();
  const events = await listPublishedEvents();
  const authReady = Boolean(process.env.AUTH_SECRET?.trim()) && providers.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8">
      <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">已发布赛事</p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">
              AI 赛事业务管理平台 MVP
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              浏览当前开放中的赛事、查看阶段与时间窗口；管理员可在后台创建并发布新的赛事活动。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {session?.user?.role === "ADMIN" ? (
              <Link href="/admin/events" className={linkButtonClassName("default", "sm")}>
                管理赛事
              </Link>
            ) : authReady ? (
              <Link href="/api/auth/signin" className={linkButtonClassName("default", "sm")}>
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

      {events.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-sm">
          <h2 className="text-2xl font-semibold">暂时还没有已发布赛事</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            管理员创建并发布赛事后，这里会自动展示到前台首页。
          </p>
          {session?.user?.role === "ADMIN" ? (
            <Link href="/admin/events/new" className={linkButtonClassName("outline", "sm", "mt-4")}>
              去创建赛事
            </Link>
          ) : null}
        </section>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <article
              key={event.id}
              className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">/{event.slug}</p>
                  <h2 className="mt-2 text-xl font-semibold">{event.name}</h2>
                </div>
                <EventPhaseBadge phase={event.phase} />
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted-foreground">
                {event.description}
              </p>

              <dl className="mt-6 grid gap-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border px-4 py-3">
                  <dt className="text-xs uppercase tracking-wide">赛事时间</dt>
                  <dd className="mt-1 text-foreground">{formatDateRange(event.startDate, event.endDate)}</dd>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard label="赛道" value={String(event.tracks.length)} />
                  <MetricCard label="奖项" value={String(event.prizes.length)} />
                  <MetricCard
                    label="评分维度"
                    value={String(event.scoringCriteria.length)}
                  />
                </div>
              </dl>

              <div className="mt-6 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  报名截止：{formatDate(event.registrationEnd)}
                </span>
                <Link
                  href={`/events/${event.slug}`}
                  className={linkButtonClassName("outline", "sm")}
                >
                  查看详情
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border px-4 py-3">
      <dt className="text-xs uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-base font-medium text-foreground">{value}</dd>
    </div>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatDateRange(startDate: Date, endDate: Date) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}
