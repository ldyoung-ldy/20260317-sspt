import { Badge } from "@/components/ui/badge";
import { getProjectStatusLabel, type ProjectStatusValue } from "@/lib/projects/status";

export function ProjectStatusBadge({ status }: { status: ProjectStatusValue }) {
  if (status === "FINAL") {
    return <Badge className="bg-green-600 text-white hover:bg-green-600">{getProjectStatusLabel(status)}</Badge>;
  }

  return (
    <Badge className="bg-amber-500 text-amber-950 hover:bg-amber-500">
      {getProjectStatusLabel(status)}
    </Badge>
  );
}
