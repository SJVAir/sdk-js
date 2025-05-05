import { Ajv, type JSONSchemaType, type ValidateFunction } from "ajv";

export type SchemaValidationFailureHandler<T> = (
  errors: ValidateFunction<T>["errors"],
  response: T,
) => void;

export function schemaValidator<T>(schema: JSONSchemaType<T>) {
  return function (
    data: T | Array<T>,
    failureHandle: SchemaValidationFailureHandler<T>,
  ) {
    const ajv = new Ajv();
    const validate = ajv.compile(schema);

    const process = (item: T) => {
      const valid = validate(item);
      if (!valid) {
        failureHandle(validate.errors, item);
      }
    };

    if (Array.isArray(data)) {
      for (const item of data) {
        process(item);
      }
    } else {
      process(data);
    }
  };
}
