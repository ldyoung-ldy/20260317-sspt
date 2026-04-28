"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { RegistrationStatusBadge } from "@/components/registrations/registration-status-badge";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ActionResult } from "@/lib/action-result";
import type { RegistrationStatusValue } from "@/lib/registration-status";
import type { AdminRegistration } from "@/lib/registrations/queries";

type UpdateResult = {
  updatedCount: number;
  nextStatus: RegistrationStatusValue;
};

type AdminRegistrationReviewTableProps = {
  registrations: AdminRegistration[];
  action: (input: {
    registrationIds: string[];
    nextStatus: "ACCEPTED" | "REJECTED";
  }) => Promise<ActionResult<UpdateResult>>;
};

export function AdminRegistrationReviewTable({
  registrations,
  action,
}: AdminRegistrationReviewTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pendingIds = useMemo(
    () => registrations.filter((item) => item.status === "PENDING").map((item) => item.id),
    [registrations]
  );
  const allPendingSelected = pendingIds.length > 0 && pendingIds.every((id) => selectedIds.includes(id));

  function toggleSelection(registrationId: string, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...current, registrationId] : current.filter((id) => id !== registrationId)
    );
  }

  function toggleAllPending(checked: boolean) {
    setSelectedIds(checked ? pendingIds : []);
  }

  function submit(nextStatus: "ACCEPTED" | "REJECTED", registrationIds: string[]) {
    if (registrationIds.length === 0) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await action({ registrationIds, nextStatus });

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      setSelectedIds([]);
      router.refresh();
    });
  }

  if (registrations.length === 0) {
    return (
      <div className="border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        当前筛选条件下暂无报名记录。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border border-border bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          已选择 {selectedIds.length} 条待处理报名，可批量执行接受或拒绝。
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isPending || selectedIds.length === 0}
            onClick={() => submit("ACCEPTED", selectedIds)}
          >
            {isPending ? <LoaderCircle className="animate-spin" /> : null}
            批量接受
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isPending || selectedIds.length === 0}
            onClick={() => submit("REJECTED", selectedIds)}
          >
            {isPending ? <LoaderCircle className="animate-spin" /> : null}
            批量拒绝
          </Button>
        </div>
      </div>

      {error ? (
        <div className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Mobile card list view */}
      <div className="flex flex-col gap-4 md:hidden">
        {registrations.map((registration) => {
          const selectable = registration.status === "PENDING";

          return (
            <article key={registration.id} className="space-y-3 border border-border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {selectable && (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(registration.id)}
                      onChange={(event) => toggleSelection(registration.id, event.target.checked)}
                      aria-label={`选择报名 ${registration.user.name ?? registration.user.email}`}
                      className="size-4 rounded border-border text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {registration.user.name ?? registration.user.email ?? "未命名用户"}
                    </p>
                    <p className="text-xs text-muted-foreground">{registration.user.email ?? "未提供邮箱"}</p>
                  </div>
                </div>
                <RegistrationStatusBadge status={registration.status} />
              </div>

              <div className="text-sm text-muted-foreground">
                {registration.teamName ? `队伍：${registration.teamName}` : "个人参赛"}
              </div>

              {registration.answers.length > 0 && (
                <div className="space-y-1 border border-dashed border-border bg-muted/50 p-3 text-sm">
                  {registration.answers.slice(0, 2).map((answer) => (
                    <p key={`${registration.id}-${answer.label}`} className="text-muted-foreground">
                      <span className="font-medium text-foreground">{answer.label}：</span>
                      {answer.value || "未填写"}
                    </p>
                  ))}
                  {registration.answers.length > 2 && (
                    <p className="text-xs text-muted-foreground">+{registration.answers.length - 2} 项</p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <span className="text-xs text-muted-foreground">{formatDate(registration.createdAt)}</span>
                {selectable ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={isPending}
                      onClick={() => submit("ACCEPTED", [registration.id])}
                    >
                      接受
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={isPending}
                      onClick={() => submit("REJECTED", [registration.id])}
                    >
                      拒绝
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">无需处理</span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allPendingSelected}
                  onChange={(event) => toggleAllPending(event.target.checked)}
                  aria-label="全选待处理报名"
                  className="size-4 rounded border-border text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </TableHead>
              <TableHead>报名人</TableHead>
              <TableHead>队伍</TableHead>
              <TableHead>补充信息</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((registration) => {
              const selectable = registration.status === "PENDING";

              return (
                <TableRow key={registration.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      disabled={!selectable}
                      checked={selectedIds.includes(registration.id)}
                      onChange={(event) => toggleSelection(registration.id, event.target.checked)}
                      aria-label={`选择报名 ${registration.id}`}
                      className="size-4 rounded border-border text-primary focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {registration.user.name ?? registration.user.email ?? "未命名用户"}
                      </p>
                      <p className="text-xs text-muted-foreground">{registration.user.email ?? "未提供邮箱"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal text-sm text-muted-foreground">
                    {registration.teamName || "个人参赛"}
                  </TableCell>
                  <TableCell className="max-w-md whitespace-normal text-sm text-muted-foreground">
                    {registration.answers.length === 0 ? (
                      "无"
                    ) : (
                      <div className="space-y-1">
                        {registration.answers.map((answer) => (
                          <p key={`${registration.id}-${answer.label}`}>
                            <span className="font-medium text-foreground">{answer.label}：</span>
                            {answer.value || "未填写"}
                          </p>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <RegistrationStatusBadge status={registration.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(registration.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      {selectable ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={isPending}
                            onClick={() => submit("ACCEPTED", [registration.id])}
                          >
                            接受
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={isPending}
                            onClick={() => submit("REJECTED", [registration.id])}
                          >
                            拒绝
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">无需处理</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
