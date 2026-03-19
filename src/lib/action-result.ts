import { ZodError, type ZodType } from "zod";

export type ActionErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        code: ActionErrorCode;
        message: string;
        fieldErrors?: Record<string, string[] | undefined>;
      };
    };

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function fail(
  code: ActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[] | undefined>
): ActionResult<never> {
  return {
    success: false,
    error: {
      code,
      message,
      fieldErrors,
    },
  };
}

export async function safeAction<TInput, TOutput>(
  input: TInput,
  handler: (input: TInput) => Promise<TOutput>
): Promise<ActionResult<TOutput>> {
  try {
    return ok(await handler(input));
  } catch (error) {
    return toActionError(error);
  }
}

export async function safeActionWithSchema<TSchema extends ZodType, TOutput>(
  schema: TSchema,
  input: unknown,
  handler: (input: TSchema["_output"]) => Promise<TOutput>
): Promise<ActionResult<TOutput>> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return fail(
      "VALIDATION_ERROR",
      "提交数据校验失败。",
      parsed.error.flatten().fieldErrors
    );
  }

  return safeAction(parsed.data, handler);
}

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof ZodError) {
    return fail(
      "VALIDATION_ERROR",
      "提交数据校验失败。",
      error.flatten().fieldErrors
    );
  }

  if (error instanceof Error) {
    return fail("INTERNAL_ERROR", error.message || "操作失败，请稍后再试。");
  }

  return fail("INTERNAL_ERROR", "操作失败，请稍后再试。");
}
