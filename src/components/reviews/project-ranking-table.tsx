import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RankedProject } from "@/lib/reviews/ranking";

export function ProjectRankingTable({
  rankings,
  showCriteria = false,
  emptyMessage = "当前还没有可展示的排名数据。",
}: {
  rankings: RankedProject[];
  showCriteria?: boolean;
  emptyMessage?: string;
}) {
  if (rankings.length === 0) {
    return (
      <div className="border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">排名</TableHead>
          <TableHead>作品</TableHead>
          <TableHead>赛道</TableHead>
          <TableHead>评分人数</TableHead>
          <TableHead className="text-right">平均总分</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rankings.map((row) => (
          <TableRow key={row.projectId}>
            <TableCell className="font-semibold text-foreground">#{row.rank}</TableCell>
            <TableCell className="max-w-md whitespace-normal">
              <div className="space-y-1">
                <p className="font-medium text-foreground">{row.projectName}</p>
                <p className="text-xs text-muted-foreground">{row.teamName || "个人参赛"}</p>
                {showCriteria ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {row.criteria.map((criterion) => (
                      <span
                        key={`${row.projectId}-${criterion.criterionName}`}
                        className="border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground"
                      >
                        {criterion.criterionName} {criterion.averageScore}/{criterion.maxScore}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </TableCell>
            <TableCell>{row.track || "未分配赛道"}</TableCell>
            <TableCell>{row.judgeCount}</TableCell>
            <TableCell className="text-right font-semibold text-foreground">
              {row.totalScore.toFixed(2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
