import Link from "next/link";
import { notFound } from "next/navigation";
import { EventPhaseBadge } from "@/components/events/event-phase-badge";
import { RegistrationStatusBadge } from "@/components/registrations/registration-status-badge";
import { Button } from "@/components/ui/button";
import { getConfiguredAuthProviders } from "@/lib/auth-providers";
import { getOptionalSession } from "@/lib/auth-session";
import { linkButtonClassName } from "@/lib/button-link";
import { canRegisterForEvent } from "@/lib/events/phase";
import { getPublishedEventBySlug } from "@/lib/events/queries";
import { getRegistrationEntryState } from "@/lib/registrations/entry-state";
import { getUserEventRegistration } from "@/lib/registrations/queries";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const session = await getOptionalSession();
  const currentRegistration = session?.user
    ? await getUserEventRegistration(event.id, session.user.id)
    : null;
  const authReady = Boolean(process.env.AUTH_SECRET?.trim()) && getConfiguredAuthProviders().length > 0;
  const registrationOpen = canRegisterForEvent(event);
  const entryState = getRegistrationEntryState({
    currentRegistrationStatus: currentRegistration?.status,
    isAuthenticated: Boolean(session?.user),
    registrationOpen,
    authReady,
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8">
      <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <EventPhaseBadge phase={event.phase} />
              <span className="text-sm text-muted-foreground">/{event.slug}</span>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">{event.name}</h1>
            <p className="max-w-3xl text-base leading-8 text-muted-foreground">
              {event.description}
            </p>
          </div>

          <div className="min-w-72 rounded-3xl border border-border bg-background p-5">
            <h2 className="text-sm font-semibold">报名状态</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {getRegistrationEntryHint(
                entryState,
                event.registrationStart,
                event.registrationEnd
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {entryState.kind === "existing" ? (
                <>
                  <RegistrationStatusBadge status={entryState.status} />
                  <Link href="/my/registrations" className={linkButtonClassName("outline", "sm")}>
                    查看我的报名
                  </Link>
                </>
              ) : entryState.kind === "can_register" ? (
                <Link href={`/events/${event.slug}/register`} className={linkButtonClassName("default", "sm")}>
                  立即报名
                </Link>
              ) : entryState.kind === "auth_unavailable" ? (
                <Button disabled>待配置登录能力</Button>
              ) : entryState.kind === "closed" ? (
                <Link href="/" className={linkButtonClassName("outline", "sm")}>
                  返回赛事列表
                </Link>
              ) : null}
              {entryState.kind === "login_required" ? (
                <span className="inline-flex items-center rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground">
                  请先登录后再报名
                </span>
              ) : null}
              {entryState.kind === "can_register" && session?.user?.role === "ADMIN" ? (
                <span className="inline-flex items-center rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground">
                  当前管理员账号也可直接报名
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">赛事时间线</h2>
          <div className="mt-4 grid gap-3">
            <TimelineItem label="赛事时间" value={formatDateRange(event.startDate, event.endDate)} />
            <TimelineItem
              label="报名阶段"
              value={formatDateRange(event.registrationStart, event.registrationEnd)}
            />
            <TimelineItem
              label="作品提交"
              value={formatDateRange(event.submissionStart, event.submissionEnd)}
            />
            <TimelineItem
              label="评审阶段"
              value={formatDateRange(event.reviewStart, event.reviewEnd)}
            />
          </div>
        </article>

        <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">赛事配置概览</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MetricCard label="赛道" value={String(event.tracks.length)} />
            <MetricCard label="奖项" value={String(event.prizes.length)} />
            <MetricCard label="评分维度" value={String(event.scoringCriteria.length)} />
          </div>
          <div className="mt-4 rounded-2xl border border-border px-4 py-4 text-sm text-muted-foreground">
            报名附加字段：{event.customFields.length > 0 ? `${event.customFields.length} 项` : "默认字段"}
          </div>
        </article>
      </section>

      {event.tracks.length > 0 ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">赛道</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {event.tracks.map((track) => (
              <article key={track.name} className="rounded-2xl border border-border p-4">
                <h3 className="font-medium">{track.name}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {track.description || "暂无赛道补充说明。"}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {event.challenges.length > 0 ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">赛题</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {event.challenges.map((challenge) => (
              <article key={challenge.title} className="rounded-2xl border border-border p-4">
                <h3 className="font-medium">{challenge.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {challenge.description || "暂无赛题补充说明。"}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {event.prizes.length > 0 ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">奖项设置</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {event.prizes.map((prize) => (
              <article key={prize.title} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium">{prize.title}</h3>
                  {prize.amount ? (
                    <span className="text-sm font-medium text-primary">{prize.amount}</span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {prize.description || "暂无奖项补充说明。"}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">评分维度</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {event.scoringCriteria.map((criterion) => (
            <article key={criterion.name} className="rounded-2xl border border-border p-4">
              <h3 className="font-medium">{criterion.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                最高分 {criterion.maxScore} / 权重 {criterion.weight}%
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function TimelineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border px-4 py-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border px-4 py-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function getRegistrationHint(registrationStart: Date, registrationEnd: Date) {
  const now = new Date();

  if (now < registrationStart) {
    return `报名将于 ${formatDate(registrationStart)} 开启。`;
  }

  if (now >= registrationEnd) {
    return "报名阶段已结束，可继续关注作品提交与评审进度。";
  }

  return "报名入口暂未开放。";
}

function getRegistrationEntryHint(
  entryState: ReturnType<typeof getRegistrationEntryState>,
  registrationStart: Date,
  registrationEnd: Date
) {
  switch (entryState.kind) {
    case "existing":
      return getRegistrationStatusHint(entryState.status);
    case "can_register":
      return "报名窗口已开启，当前登录账号可立即提交报名表。";
    case "login_required":
      return "报名窗口已开启，请先登录后再进入报名表单。";
    case "auth_unavailable":
      return "报名窗口已开启，但当前环境尚未配置登录能力。";
    case "closed":
      return getRegistrationHint(registrationStart, registrationEnd);
  }
}

function getRegistrationStatusHint(
  status: "PENDING" | "ACCEPTED" | "CONFIRMED" | "REJECTED" | "CANCELLED"
) {
  switch (status) {
    case "PENDING":
      return "你已提交报名，当前等待管理员审核。";
    case "ACCEPTED":
      return "管理员已接受你的报名，请前往“我的报名”确认参赛。";
    case "CONFIRMED":
      return "你已确认参赛，可继续关注后续作品提交与评审安排。";
    case "REJECTED":
      return "本次报名未通过审核，如有疑问请联系管理员。";
    case "CANCELLED":
      return "你已取消本次报名，当前不会参与后续流程。";
  }
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
