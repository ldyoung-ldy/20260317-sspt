import { cn } from "@/lib/utils";

/**
 * Skeleton — 骨架屏加载占位组件
 *
 * 配合 CSS animation 提供内容加载时的视觉占位，
 * 避免出现空白或跳动。
 */

function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-muted",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
