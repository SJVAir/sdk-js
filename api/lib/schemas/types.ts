import type { ValidateFunction } from "ajv";

export type SchemaValidationFailureHandler<T> = (
  errors: ValidateFunction<T>["errors"],
  response: T,
) => void;
