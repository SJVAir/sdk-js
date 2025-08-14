import { fail } from "@std/assert";
import type { ZodType } from "zod";
import { getSimpleValidation } from "./schema.ts";

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
