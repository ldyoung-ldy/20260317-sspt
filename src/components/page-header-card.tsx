import { type ReactNode } from "react";

/**
 * PageHeaderCard — 页面头部卡片
 *
 * 标签 + 标题 + 描述 + 操作区（可选 badge 行 / 按钮区域）。
 */

export function PageHeaderCard({
  tag,
  title,
  description,
  extra,
  actions,
}: {
  tag?: string;
  title: string;
  description: string;
  extra?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          {tag ? (
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              {tag}
            </p>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{description}</p>
          {extra ? <div className="pt-1">{extra}</div> : null}
        </div>
        {actions ? (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-3 lg:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
