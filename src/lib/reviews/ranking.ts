import type { EventScoringCriterionInput } from "@/lib/events/schema";
import {
  calculateJudgeTotalScore,
  parseStoredJudgeScoreEntries,
  type StoredJudgeScoreEntry,
} from "@/lib/reviews/schema";

type ProjectScoreSource = {
  judgeId: string;
  scores: unknown;
};

type RankingProjectSource = {
  id: string;
  name: string;
  teamName: string | null;
  track: string | null;
  scoreRecords: ProjectScoreSource[];
};

export type RankedProject = {
  rank: number;
  projectId: string;
  projectName: string;
  teamName: string | null;
  track: string | null;
  totalScore: number;
  judgeCount: number;
  criteria: {
    criterionName: string;
    averageScore: number;
    maxScore: number;
    weight: number;
  }[];
};

export function buildProjectRankings(
  criteria: EventScoringCriterionInput[],
  projects: RankingProjectSource[]
) {
  const rankingRows = projects
    .map((project) => buildProjectRankingRow(criteria, project))
    .filter((row): row is RankedProject => row !== null)
    .sort((left, right) => {
      if (right.totalScore !== left.totalScore) {
        return right.totalScore - left.totalScore;
      }

      if (right.judgeCount !== left.judgeCount) {
        return right.judgeCount - left.judgeCount;
      }

      return left.projectName.localeCompare(right.projectName, "zh-CN");
    });

  return rankingRows.reduce<RankedProject[]>((result, row, index) => {
    const previousRow = result[index - 1];
    const rank =
      previousRow &&
      previousRow.totalScore === row.totalScore &&
      previousRow.judgeCount === row.judgeCount
        ? previousRow.rank
        : index + 1;

    result.push({
      ...row,
      rank,
    });

    return result;
  }, []);
}

export function hasValidScores(
  criteria: EventScoringCriterionInput[],
  scores: ProjectScoreSource[]
) {
  return scores.some((scoreRecord) => isScoreRecordCompatible(criteria, scoreRecord.scores));
}

function buildProjectRankingRow(
  criteria: EventScoringCriterionInput[],
  project: RankingProjectSource
) {
  const compatibleScores = project.scoreRecords
    .map((scoreRecord) => parseCompatibleScoreRecord(criteria, scoreRecord.scores))
    .filter((entry): entry is StoredJudgeScoreEntry[] => entry !== null);

  if (compatibleScores.length === 0) {
    return null;
  }

  return {
    rank: 0,
    projectId: project.id,
    projectName: project.name,
    teamName: project.teamName,
    track: project.track,
    totalScore: roundScore(
      compatibleScores.reduce((sum, scoreEntries) => sum + calculateJudgeTotalScore(scoreEntries), 0) /
        compatibleScores.length
    ),
    judgeCount: compatibleScores.length,
    criteria: criteria.map((criterion) => {
      const criterionScores = compatibleScores.map((scoreEntries) => {
        const currentEntry = scoreEntries.find((entry) => entry.criterionName === criterion.name);
        return currentEntry?.score ?? 0;
      });

      return {
        criterionName: criterion.name,
        averageScore: roundScore(
          criterionScores.reduce((sum, score) => sum + score, 0) / criterionScores.length
        ),
        maxScore: criterion.maxScore,
        weight: criterion.weight,
      };
    }),
  } satisfies RankedProject;
}

function parseCompatibleScoreRecord(
  criteria: EventScoringCriterionInput[],
  scores: unknown
) {
  const entries = parseStoredJudgeScoreEntries(scores);

  if (!entries.length || !isMatchingCriteria(criteria, entries)) {
    return null;
  }

  return entries;
}

function isScoreRecordCompatible(criteria: EventScoringCriterionInput[], scores: unknown) {
  const entries = parseStoredJudgeScoreEntries(scores);
  return entries.length > 0 && isMatchingCriteria(criteria, entries);
}

function isMatchingCriteria(
  criteria: EventScoringCriterionInput[],
  entries: StoredJudgeScoreEntry[]
) {
  if (criteria.length !== entries.length) {
    return false;
  }

  return criteria.every((criterion) =>
    entries.some(
      (entry) =>
        entry.criterionName === criterion.name &&
        entry.maxScore === criterion.maxScore &&
        entry.weight === criterion.weight
    )
  );
}

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}
