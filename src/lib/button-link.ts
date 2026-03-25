import { cn } from "@/lib/utils";

const baseClassName =
  "inline-flex shrink-0 items-center justify-center rounded-md border text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50";

const variantClassName = {
  default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
  outline:
    "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
};

const sizeClassName = {
  default: "h-8 gap-1.5 px-2.5",
  sm: "h-7 gap-1 rounded-md px-2.5 text-[0.8rem]",
};

export function linkButtonClassName(
  variant: keyof typeof variantClassName = "default",
  size: keyof typeof sizeClassName = "sm",
  className?: string
) {
  return cn(baseClassName, variantClassName[variant], sizeClassName[size], className);
}
