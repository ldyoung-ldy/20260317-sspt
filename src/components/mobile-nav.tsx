"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileNav({
  items,
  userLabel,
  userRole,
}: {
  items: { href: string; label: string }[];
  userLabel?: string;
  userRole?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="sm"
        className="size-9 p-0"
        onClick={() => setOpen(!open)}
        aria-label={open ? "关闭菜单" : "打开菜单"}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {open ? (
        <div className="absolute left-0 right-0 top-16 z-50 border-b border-border bg-background/98 px-6 py-4 shadow-lg backdrop-blur">
          <nav className="flex flex-col gap-3">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {userLabel ? (
            <div className="mt-4 rounded-xl border border-border bg-muted/30 px-3 py-3">
              <p className="text-sm font-medium">{userLabel}</p>
              <p className="text-xs text-muted-foreground">
                {userRole === "ADMIN" ? "管理员" : "普通用户"}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
