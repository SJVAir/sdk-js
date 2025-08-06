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

export const bboxSchema: JSONSchemaType<BBox> = {
  type: "array",
  oneOf: [
    {
      type: "array",
      items: [
        { type: "number" },
        { type: "number" },
        { type: "number" },
        { type: "number" },
      ],
      minItems: 4,
      maxItems: 4,
    },
    {
      type: "array",
      items: [
        { type: "number" },
        { type: "number" },
        { type: "number" },
        { type: "number" },
        { type: "number" },
        { type: "number" },
      ],
      minItems: 6,
      maxItems: 6,
    },
  ],
};
//export const multipolygonSchema: JSONSchemaType<MultiPolygon> = {
//  type: "object",
//  properties: {
//    coordinates: [],
//    type: { type: "string", const: "MultiPolygon" },
//    bbox: bboxSchema,
//  },
//  required: ["coordinates", "type"],
//};
export const multiPolygonSchema: JSONSchemaType<MultiPolygon> = {
  type: "object",
  properties: {
    type: { type: "string", const: "MultiPolygon" },
    coordinates: {
      type: "array",
      items: {
        type: "array",
        items: {
          type: "array",
          items: [{ type: "number" }, { type: "number" }],
          minItems: 2,
          maxItems: 2,
        },
        minItems: 4,
      },
    },
    bbox: bboxSchema,
  },
  required: ["type", "coordinates"],
  additionalProperties: false,
};
