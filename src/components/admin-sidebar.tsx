"use client";

import Link from "next/link";
import { LayoutDashboard, Trophy } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  {
    href: "/admin",
    label: "概览",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/events",
    label: "赛事管理",
    icon: Trophy,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 rounded-3xl border border-border bg-card p-4 shadow-sm lg:w-64">
      <div className="mb-4 px-2">
        <h2 className="text-sm font-semibold">管理后台</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Step 1 先搭基础框架，后续逐步补赛事、报名、评分和排名模块。
        </p>
      </div>

      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
