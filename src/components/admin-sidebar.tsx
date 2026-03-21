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
    <aside className="w-full shrink-0 rounded-2xl border border-border bg-card p-4 shadow-sm lg:w-64">
      <div className="mb-4 rounded-xl border border-border/70 bg-muted/30 px-3 py-3">
        <h2 className="text-sm font-semibold tracking-tight">管理后台</h2>
        <p className="mt-1 text-xs leading-6 text-muted-foreground">
          赛事管理与运营控制台
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
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
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
