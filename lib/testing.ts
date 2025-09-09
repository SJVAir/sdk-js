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

export const coordinates = {
  latitude: assertTestVariable("LATITUDE"),
  longitude: assertTestVariable("LONGITUDE"),
};

export const loginCredentials = {
  identifier: assertTestVariable("LOGIN_ID"),
  password: assertTestVariable("LOGIN_PASS"),
};

export const monitorId = assertTestVariable("MONITOR_ID");
