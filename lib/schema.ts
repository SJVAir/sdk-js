import { Ajv, type JSONSchemaType, type ValidateFunction } from "ajv";
import type { BBox, MultiPolygon } from "geojson";

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

export const multiPolygonSchema: JSONSchemaType<Omit<MultiPolygon, "bbox">> = {
  type: "object",
  properties: {
    type: { type: "string", const: "MultiPolygon" },
    coordinates: {
      type: "array",
      items: { // Each item in the coordinates array is a Polygon
        type: "array",
        items: { // Each item in a Polygon array is a LinearRing
          type: "array",
          minItems: 4, // A LinearRing must have at least 4 positions
          items: { // Each item in a LinearRing array is a position (array of numbers)
            type: "array",
            minItems: 2, // A position must have at least longitude and latitude
            maxItems: 3, // Optional altitude can be included
            items: { type: "number" },
          },
        },
      },
    },
  },
  required: ["type", "coordinates"],
  additionalProperties: true,
} as JSONSchemaType<Omit<MultiPolygon, "bbox">>;
