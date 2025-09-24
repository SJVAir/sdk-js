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

export const EXISTING_PHONE = assertTestVariable("PHONE");
export const EXISTING_MONITOR_ID = assertTestVariable("MONITOR_ID");

export const COORDINATES = {
  latitude: assertTestVariable("LATITUDE"),
  longitude: assertTestVariable("LONGITUDE"),
};
