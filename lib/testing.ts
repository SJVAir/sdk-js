import { fail } from "@std/assert";
import type { ZodType } from "zod";
import { getSimpleValidation } from "./schema.ts";

function assertTestVariable(variable: string) {
  const envVar = Deno.env.get(`TEST_${variable}`);

  if (envVar === undefined) {
    console.error(`Environment variable "TEST_${variable}" is not defined`);
    Deno.exit(1);
  }

  return envVar;
}

export function getSimpleValidationTest<T extends ZodType>(
  schema: T,
) {
  return getSimpleValidation(
    schema,
    (error, item) => {
      fail(`${error.message}\n${JSON.stringify(item, undefined, 2)}`);
    },
  );
}

/**
 * Whether an integration probe failed because the dev server lacks the
 * endpoint (404) or can't be reached. Any other failure is a real one and
 * should be rethrown.
 */
export function isUnavailable(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  const cause =
    (error as { cause?: { status?: number; result?: { status?: number } } })
      ?.cause;
  return cause?.status === 404 || cause?.result?.status === 404;
}

export const EXISTING_PHONE = assertTestVariable("PHONE");
export const EXISTING_MONITOR_ID = assertTestVariable("MONITOR_ID");

export const COORDINATES = {
  latitude: assertTestVariable("LATITUDE"),
  longitude: assertTestVariable("LONGITUDE"),
};
