import Link from "next/link";
import { getConfiguredAuthProviders } from "@/lib/auth-providers";
import { getOptionalSession } from "@/lib/auth-session";
import { EmptyState } from "@/components/empty-state";
import { EventPhaseBadge } from "@/components/events/event-phase-badge";
import { MetricCard } from "@/components/metric-card";
import { PageHeaderCard } from "@/components/page-header-card";
import { linkButtonClassName } from "@/lib/button-link";
import { listPublishedEvents } from "@/lib/events/queries";
import { formatDate, formatDateRange } from "@/lib/format";

export default async function Home() {
  const session = await getOptionalSession();
  const providers = getConfiguredAuthProviders();
  const events = await listPublishedEvents();
  const authReady = Boolean(process.env.AUTH_SECRET?.trim()) && providers.length > 0;
  const summary = events.reduce(
    (acc, event) => {
      acc.tracks += event.tracks.length;
      acc.prizes += event.prizes.length;
      acc.criteria += event.scoringCriteria.length;
      return acc;
    },
    { tracks: 0, prizes: 0, criteria: 0 }
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8">
      <PageHeaderCard
        tag="前台首页"
        title="AI 赛事业务管理平台 MVP"
        description="浏览当前开放中的赛事、查看阶段与时间窗口；管理员可在后台创建并发布新的赛事活动。"
        extra={
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="rounded-full border border-border bg-muted/40 px-3 py-1.5">
              {events.length} 个已发布赛事
            </span>
            <span className="rounded-full border border-border bg-muted/40 px-3 py-1.5">
              {authReady ? "登录能力已配置" : "等待 OAuth 配置"}
            </span>
            <span className="rounded-full border border-border bg-muted/40 px-3 py-1.5">
              管理员可直接进入后台
            </span>
          </div>
        }
        actions={
          session?.user?.role === "ADMIN" ? (
            <Link href="/admin/events" className={linkButtonClassName("default", "sm")}>
              管理赛事
            </Link>
          ) : authReady ? (
            <Link
              href="/api/auth/signin"
              prefetch={false}
              className={linkButtonClassName("default", "sm")}
            >
              配置完成后登录
            </Link>
          ) : (
            <span className="inline-flex h-7 items-center rounded-[10px] border border-dashed border-border px-3 text-sm text-muted-foreground">
              先补全 OAuth 环境变量
            </span>
          )
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="已发布赛事" value={String(events.length)} standalone />
        <MetricCard label="赛道总数" value={String(summary.tracks)} standalone />
        <MetricCard label="评分维度总数" value={String(summary.criteria)} standalone />
      </section>

      {events.length === 0 ? (
        <EmptyState
          title="暂时还没有已发布赛事"
          description="管理员创建并发布赛事后，这里会自动展示到前台首页。"
        >
          {session?.user?.role === "ADMIN" ? (
            <Link href="/admin/events/new" className={linkButtonClassName("outline", "sm", "mt-4")}>
              去创建赛事
            </Link>
          ) : null}
        </EmptyState>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <article
              key={event.id}
              className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
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
