import Link from "next/link";
import { cancelRegistration, confirmRegistration } from "@/app/my/registrations/actions";
import { RegistrationActionButton } from "@/components/registrations/registration-action-button";
import { RegistrationStatusBadge } from "@/components/registrations/registration-status-badge";
import { linkButtonClassName } from "@/lib/button-link";
import { requireUser } from "@/lib/auth-guards";
import {
  canCancelRegistration,
  canConfirmRegistration,
} from "@/lib/registration-status";
import { listUserRegistrations } from "@/lib/registrations/queries";

export default async function MyRegistrationsPage() {
  const session = await requireUser("/my/registrations");
  const registrations = await listUserRegistrations(session.user.id);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8">
      <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">用户中心</p>
            <h1 className="text-3xl font-semibold tracking-tight">我的报名</h1>
            <p className="text-sm leading-7 text-muted-foreground">
              查看你已提交的赛事报名，管理员录取后可在此确认参赛，已录取或已确认状态也可主动取消。
            </p>
          </div>
          <Link href="/" className={linkButtonClassName("outline", "sm")}>
            返回首页
          </Link>
        </div>
      </section>

      {registrations.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-sm">
          <h2 className="text-2xl font-semibold">你还没有提交任何报名</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            去首页或赛事详情页查看当前开放中的赛事，提交后这里会展示你的报名状态。
          </p>
          <Link href="/" className={linkButtonClassName("default", "sm", "mt-4")}>
            去看赛事
          </Link>
        </section>
      ) : (
        <section className="grid gap-6 lg:grid-cols-2">
          {registrations.map((registration) => (
            <article
              key={registration.id}
              className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">/{registration.event.slug}</p>
                  <h2 className="text-xl font-semibold">{registration.event.name}</h2>
                </div>
                <RegistrationStatusBadge status={registration.status} />
              </div>

              <dl className="mt-6 grid gap-3 text-sm text-muted-foreground">
                <InfoItem label="报名时间" value={formatDate(registration.createdAt)} />
                <InfoItem label="队伍名称" value={registration.teamName || "个人参赛"} />
                <InfoItem
                  label="赛事时间"
                  value={formatDateRange(registration.event.startDate, registration.event.endDate)}
                />
              </dl>

              <div className="mt-6 rounded-2xl border border-border px-4 py-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">补充信息</p>
                {registration.answers.length === 0 ? (
                  <p className="mt-2">无额外报名字段。</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {registration.answers.map((answer) => (
                      <p key={`${registration.id}-${answer.label}`}>
                        <span className="font-medium text-foreground">{answer.label}：</span>
                        {answer.value || "未填写"}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/events/${registration.event.slug}`} className={linkButtonClassName("outline", "sm")}>
                  查看赛事
                </Link>
                {canConfirmRegistration(registration.status) ? (
                  <RegistrationActionButton
                    action={confirmRegistration}
                    registrationId={registration.id}
                    label="确认参赛"
                    pendingLabel="确认中..."
                  />
                ) : null}
                {canCancelRegistration(registration.status) ? (
                  <RegistrationActionButton
                    action={cancelRegistration}
                    registrationId={registration.id}
                    label="取消报名"
                    pendingLabel="取消中..."
                    variant="destructive"
                  />
                ) : null}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border px-4 py-3">
      <dt className="text-xs uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-foreground">{value}</dd>
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
