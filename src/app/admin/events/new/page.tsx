import Link from "next/link";
import { createEvent } from "@/app/admin/events/actions";
import { EventForm } from "@/components/events/event-form";
import { linkButtonClassName } from "@/lib/button-link";

export default function AdminNewEventPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">赛事管理 / 新建</p>
            <h1 className="text-3xl font-semibold tracking-tight">创建新赛事</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              先补齐赛事基础信息、时间窗口、赛道和评分维度，保存后会先进入草稿状态。
            </p>
          </div>

          <Link href="/admin/events" className={linkButtonClassName("outline", "sm")}>
            返回列表
          </Link>
        </div>
      </section>

      <EventForm action={createEvent} />
    </div>
  );
}
