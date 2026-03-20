import Link from "next/link";
import { togglePublish } from "@/app/admin/events/actions";
import { EventDeleteButton } from "@/components/events/event-delete-button";
import { EventPhaseBadge } from "@/components/events/event-phase-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { linkButtonClassName } from "@/lib/button-link";
import { listAdminEvents } from "@/lib/events/queries";

export default async function AdminEventsPage() {
  const events = await listAdminEvents();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">赛事管理</p>
            <h1 className="text-3xl font-semibold tracking-tight">赛事列表</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              在这里创建、编辑赛事，查看当前阶段，并按需将草稿发布到前台首页。
            </p>
            <p className="text-xs text-muted-foreground">
              安全删除策略：仅未发布且没有报名、作品、评分、评委分配数据的赛事可删除。
            </p>
          </div>

          <Link href="/admin/events/new" className={linkButtonClassName("default", "sm")}>
            创建赛事
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <h2 className="text-lg font-semibold">还没有赛事</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              先创建第一个赛事，随后即可在这里发布并同步到前台首页。
            </p>
            <Link href="/admin/events/new" className={linkButtonClassName("outline", "sm", "mt-4")}>
              立即创建
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>赛事</TableHead>
                <TableHead>阶段</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>时间</TableHead>
                <TableHead>配置</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="max-w-sm whitespace-normal">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{event.name}</p>
                      <p className="text-xs text-muted-foreground">/{event.slug}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {event.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <EventPhaseBadge phase={event.phase} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={event.published ? "default" : "outline"}>
                      {event.published ? "已发布" : "草稿"}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal text-sm text-muted-foreground">
                    <div>{formatDateRange(event.startDate, event.endDate)}</div>
                    <div className="mt-1 text-xs">报名截止：{formatDate(event.registrationEnd)}</div>
                  </TableCell>
                  <TableCell className="whitespace-normal text-sm text-muted-foreground">
                    <div>{event.tracks.length} 个赛道</div>
                    <div>{event.prizes.length} 个奖项</div>
                    <div>{event.scoringCriteria.length} 个评分维度</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className={linkButtonClassName("outline", "sm")}
                      >
                        编辑
                      </Link>
                      {event.published ? (
                        <Link
                          href={`/events/${event.slug}`}
                          className={linkButtonClassName("outline", "sm")}
                        >
                          预览
                        </Link>
                      ) : (
                        <span className={linkButtonClassName("outline", "sm", "pointer-events-none opacity-60")}>
                          待发布
                        </span>
                      )}
                      <form
                        action={async () => {
                          "use server";
                          const result = await togglePublish({
                            eventId: event.id,
                            published: !event.published,
                          });

                          if (!result.success) {
                            throw new Error(result.error.message);
                          }
                        }}
                      >
                        <Button type="submit" variant="outline" size="sm">
                          {event.published ? "取消发布" : "发布"}
                        </Button>
                      </form>
                      {!event.published ? <EventDeleteButton eventId={event.id} /> : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
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
