import Link from "next/link";
import { notFound } from "next/navigation";
import { updateEvent } from "@/app/admin/events/actions";
import { EventDeleteButton } from "@/components/events/event-delete-button";
import { EventForm } from "@/components/events/event-form";
import { linkButtonClassName } from "@/lib/button-link";
import { getAdminEventById } from "@/lib/events/queries";
import { type EventFormInput } from "@/lib/events/schema";

export default async function AdminEditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getAdminEventById(id);

  if (!event) {
    notFound();
  }

  const eventId = event.id;

  async function submitAction(input: EventFormInput) {
    "use server";

    return updateEvent({
      ...input,
      eventId,
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">赛事管理 / 编辑</p>
            <h1 className="text-3xl font-semibold tracking-tight">编辑赛事</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              当前正在编辑“{event.name}”，保存后会直接覆盖后台配置；若赛事已发布，前台详情也会同步刷新。
            </p>
            <p className="text-xs text-muted-foreground">当前 slug：/{event.slug}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {!event.published ? (
              <EventDeleteButton eventId={event.id} redirectTo="/admin/events" />
            ) : null}
            <Link
              href={`/admin/events/${event.id}/registrations`}
              className={linkButtonClassName("outline", "sm")}
            >
              报名管理
            </Link>
            {event.published ? (
              <Link
                href={`/events/${event.slug}`}
                className={linkButtonClassName("outline", "sm")}
              >
                查看前台
              </Link>
            ) : null}
            <Link href="/admin/events" className={linkButtonClassName("outline", "sm")}>
              返回列表
            </Link>
          </div>
        </div>
      </section>

      <EventForm
        action={submitAction}
        initialValues={event}
        submitLabel="保存修改"
        helperText={
          event.published
            ? "保存后会刷新后台列表与前台赛事详情，请确认时间窗口与展示信息无误。"
            : "保存后仍保持草稿状态，可返回列表后再决定是否发布。"
        }
      />
    </div>
  );
}
