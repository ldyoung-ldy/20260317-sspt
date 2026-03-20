import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { getEventPhaseLabel, type EventPhase } from "@/lib/events/phase";

const phaseVariantMap: Record<
  EventPhase,
  ComponentProps<typeof Badge>["variant"]
> = {
  DRAFT: "outline",
  UPCOMING: "secondary",
  REGISTRATION: "default",
  SUBMISSION_PENDING: "secondary",
  SUBMISSION: "default",
  REVIEW_PENDING: "secondary",
  REVIEW: "default",
  COMPLETED: "outline",
};

export function EventPhaseBadge({ phase }: { phase: EventPhase }) {
  return <Badge variant={phaseVariantMap[phase]}>{getEventPhaseLabel(phase)}</Badge>;
}
