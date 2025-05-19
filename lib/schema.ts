import { Ajv, type JSONSchemaType, type ValidateFunction } from "ajv";

export type SchemaValidationFailureHandler<T> = (
  errors: ValidateFunction<T>["errors"],
  response: T,
) => void;

export interface SchemaValidatorOptions {
  checkArray: boolean;
}

export function schemaValidator<T>(
  schema: JSONSchemaType<T>,
  options?: SchemaValidatorOptions,
) {
  return function (
    data: T | Array<T>,
    failureHandle: SchemaValidationFailureHandler<T | Array<T>>,
  ) {
    const ajv = new Ajv();
    const validate = ajv.compile(schema);

    const process = (item: T | Array<T>) => {
      const valid = validate(item);
      if (!valid) {
        failureHandle(validate.errors, item);
      }
    };

    if (Array.isArray(data) && !options?.checkArray) {
      for (const item of data) {
        process(item);
      }
    } else {
      process(data);
    }
  };
}
