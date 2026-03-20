import { Badge } from "@/components/ui/badge";
import {
  getRegistrationStatusLabel,
  type RegistrationStatusValue,
} from "@/lib/registration-status";

export function RegistrationStatusBadge({ status }: { status: RegistrationStatusValue }) {
  return (
    <Badge variant={getVariant(status)}>{getRegistrationStatusLabel(status)}</Badge>
  );
}

function getVariant(status: RegistrationStatusValue): "default" | "outline" | "secondary" | "destructive" {
  switch (status) {
    case "CONFIRMED":
      return "default";
    case "ACCEPTED":
      return "secondary";
    case "REJECTED":
      return "destructive";
    case "PENDING":
    case "CANCELLED":
      return "outline";
  }
}
