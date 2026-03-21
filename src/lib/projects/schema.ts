import { z } from "zod";
import {
  eventChallengeListSchema,
  eventTrackListSchema,
  type EventChallengeInput,
  type EventTrackInput,
} from "@/lib/events/schema";

const projectChallengeListSchema = z.array(z.string().trim().min(1)).default([]);

const optionalUrlField = z
  .string()
  .trim()
  .max(2_048, "链接长度不能超过 2048 个字符。")
  .default("")
  .refine((value) => value.length === 0 || isValidHttpUrl(value), "请输入有效链接。");

export const projectFormSchema = z.object({
  eventId: z.string().uuid("赛事 ID 无效。"),
  name: z.string().trim().min(1, "请输入作品名称。").max(120, "作品名称最多 120 个字符。"),
  description: z
    .string()
    .trim()
    .min(1, "请输入作品描述。")
    .max(5_000, "作品描述最多 5000 个字符。"),
  sourceUrl: optionalUrlField,
  demoUrl: optionalUrlField,
  videoUrl: optionalUrlField,
  track: z.string().trim().max(120, "赛道名称最多 120 个字符。").default(""),
  challenges: projectChallengeListSchema,
});

export type ProjectFormInput = z.output<typeof projectFormSchema>;

export function parseProjectChallenges(value: unknown) {
  const result = projectChallengeListSchema.safeParse(value);
  return result.success ? result.data : [];
}

export function parseProjectConfig(input: {
  tracks: unknown;
  challenges: unknown;
}) {
  const tracksResult = eventTrackListSchema.safeParse(input.tracks);
  const challengesResult = eventChallengeListSchema.safeParse(input.challenges);

  return {
    tracks: tracksResult.success ? tracksResult.data : [],
    challenges: challengesResult.success ? challengesResult.data : [],
  };
}

export function validateProjectFormInput(
  config: { tracks: EventTrackInput[]; challenges: EventChallengeInput[] },
  payload: ProjectFormInput
) {
  const fieldErrors: Record<string, string[]> = {};
  const allowedTracks = new Set(config.tracks.map((track) => track.name));
  const allowedChallenges = new Set(config.challenges.map((challenge) => challenge.title));
  const normalizedTrack = payload.track.trim();
  const normalizedChallenges = Array.from(
    new Set(payload.challenges.map((challenge) => challenge.trim()).filter(Boolean))
  );

  if (config.tracks.length === 0) {
    if (normalizedTrack.length > 0) {
      fieldErrors.track = ["当前赛事未配置赛道，请刷新页面后重试。"];
    }
  } else if (normalizedTrack.length === 0) {
    fieldErrors.track = ["请选择参赛赛道。"];
  } else if (!allowedTracks.has(normalizedTrack)) {
    fieldErrors.track = ["请选择有效赛道。"];
  }

  const invalidChallenges = normalizedChallenges.filter(
    (challenge) => !allowedChallenges.has(challenge)
  );

  if (invalidChallenges.length > 0) {
    fieldErrors.challenges = ["请选择有效赛题。"];
  }

  return {
    success: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    data: {
      name: payload.name.trim(),
      description: payload.description.trim(),
      sourceUrl: payload.sourceUrl.trim() || null,
      demoUrl: payload.demoUrl.trim() || null,
      videoUrl: payload.videoUrl.trim() || null,
      track: config.tracks.length > 0 ? normalizedTrack || null : null,
      challenges: normalizedChallenges,
    },
  };
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
