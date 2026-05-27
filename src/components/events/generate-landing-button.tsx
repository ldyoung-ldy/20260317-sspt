import Link from "next/link";
import { Button } from "@/components/ui/button";

interface GenerateLandingButtonProps {
  eventId: string;
  hasLandingPage: boolean;
}

export function GenerateLandingButton({
  eventId,
  hasLandingPage,
}: GenerateLandingButtonProps) {
  return (
    <Link href={`/admin/events/${eventId}/generating`}>
      <Button variant="outline" size="sm">
        {hasLandingPage ? "重新生成赛事页" : "生成赛事页"}
      </Button>
    </Link>
  );
}
