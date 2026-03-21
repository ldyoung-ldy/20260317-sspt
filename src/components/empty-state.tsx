import { type ReactNode } from "react";

/**
 * EmptyState — 通用空状态展示组件
 *
 * 虚线边框卡片 + 标题 + 描述 + 可选操作区域。
 */

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-sm lg:p-10">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      {children}
    </div>
  );
}
