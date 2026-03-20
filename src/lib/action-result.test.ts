import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  ActionResultError,
  fail,
  ok,
  safeAction,
  safeActionWithSchema,
} from "@/lib/action-result";

describe("action-result", () => {
  it("creates success payloads", () => {
    expect(ok({ id: 1 })).toEqual({ success: true, data: { id: 1 } });
  });

  it("creates error payloads", () => {
    expect(fail("FORBIDDEN", "禁止访问")).toEqual({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "禁止访问",
        fieldErrors: undefined,
      },
    });
  });

  it("wraps async handler success", async () => {
    await expect(
      safeAction({ count: 1 }, async ({ count }) => count + 1)
    ).resolves.toEqual({ success: true, data: 2 });
  });

  it("converts thrown errors to internal error results", async () => {
    await expect(
      safeAction(null, async () => {
        throw new Error("boom");
      })
    ).resolves.toEqual({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "boom",
        fieldErrors: undefined,
      },
    });
  });

  it("preserves action error codes", async () => {
    await expect(
      safeAction(null, async () => {
        throw new ActionResultError("FORBIDDEN", "禁止访问");
      })
    ).resolves.toEqual({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "禁止访问",
        fieldErrors: undefined,
      },
    });
  });

  it("validates schema before invoking handler", async () => {
    const schema = z.object({ name: z.string().min(1) });

    await expect(
      safeActionWithSchema(schema, { name: "Factory" }, async ({ name }) => ({
        greeting: `Hello ${name}`,
      }))
    ).resolves.toEqual({
      success: true,
      data: {
        greeting: "Hello Factory",
      },
    });

    await expect(
      safeActionWithSchema(schema, { name: "" }, async () => ({ greeting: "x" }))
    ).resolves.toMatchObject({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
      },
    });
  });
});
