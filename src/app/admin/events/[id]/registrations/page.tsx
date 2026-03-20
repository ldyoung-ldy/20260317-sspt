import Link from "next/link";
import { notFound } from "next/navigation";
import { updateRegistrationStatus } from "@/app/admin/events/actions";
import { AdminRegistrationReviewTable } from "@/components/registrations/admin-registration-review-table";
import { EventPhaseBadge } from "@/components/events/event-phase-badge";
import { Button } from "@/components/ui/button";
import { linkButtonClassName } from "@/lib/button-link";
import {
  getRegistrationStatusLabel,
  registrationStatuses,
} from "@/lib/registration-status";
import {
  getAdminEventRegistrations,
  parseAdminRegistrationFilters,
} from "@/lib/registrations/queries";

export default async function AdminEventRegistrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; query?: string }>;
}) {
  const { id } = await params;
  const filters = parseAdminRegistrationFilters(await searchParams);
  const data = await getAdminEventRegistrations(id, filters);

  if (!data) {
    notFound();
  }

  async function submitAction(input: {
    registrationIds: string[];
    nextStatus: "ACCEPTED" | "REJECTED";
  }) {
    "use server";

    return updateRegistrationStatus({
      eventId: id,
      ...input,
    });
  }

  const exportHref = buildExportHref(id, filters);
  const totalCount = Object.values(data.statusCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-muted-foreground">赛事管理 / 报名审核</p>
              <EventPhaseBadge phase={data.event.phase} />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{data.event.name}</h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              审核报名申请、筛选报名状态，并导出当前筛选结果为 CSV。只有待审核报名支持批量接受或拒绝。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={exportHref} className={linkButtonClassName("outline", "sm")}>
              导出 CSV
            </Link>
            <Link href={`/admin/events/${id}/edit`} className={linkButtonClassName("outline", "sm")}>
              编辑赛事
            </Link>
            <Link href="/admin/events" className={linkButtonClassName("outline", "sm")}>
              返回赛事列表
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="总报名数" value={String(totalCount)} />
        {registrationStatuses.map((status) => (
          <MetricCard
            key={status}
            label={getRegistrationStatusLabel(status)}
            value={String(data.statusCounts[status])}
          />
        ))}
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <form className="grid gap-4 md:grid-cols-[1.4fr_0.8fr_auto_auto]">
          <div>
            <label className="text-sm font-medium">搜索报名人 / 邮箱 / 队伍</label>
            <input
              name="query"
              defaultValue={filters.query}
              placeholder="例如：张三、team、example@company.com"
              className="mt-2 flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium">状态筛选</label>
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="mt-2 flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">全部状态</option>
              {registrationStatuses.map((status) => (
                <option key={status} value={status}>
                  {getRegistrationStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="outline" size="sm">
              应用筛选
            </Button>
          </div>
          <div className="flex items-end">
            <Link href={`/admin/events/${id}/registrations`} className={linkButtonClassName("outline", "sm")}>
              重置
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <AdminRegistrationReviewTable registrations={data.registrations} action={submitAction} />
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </article>
  );
}

function buildExportHref(
  eventId: string,
  filters: {
    status?: string;
    query: string;
  }
) {
  const searchParams = new URLSearchParams();

  if (filters.status) {
    searchParams.set("status", filters.status);
  }

  if (filters.query) {
    searchParams.set("query", filters.query);
  }

  const suffix = searchParams.toString();
  return `/admin/events/${eventId}/registrations/export${suffix ? `?${suffix}` : ""}`;
}
