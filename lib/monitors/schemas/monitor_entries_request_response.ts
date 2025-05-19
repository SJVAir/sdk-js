import { schemaValidator } from "../../schema.ts";
import {
  monitorEntrySchema,
  monitorParticulatesEntrySchema,
  monitorPressureEntrySchema,
  monitorTemperatureEntrySchema,
} from "./monitor.ts";
import type { JSONSchemaType } from "ajv";
import type { MonitorEntryRequestResponse } from "../fetch_monitor_entries/types.ts";
import type { MonitorDataField } from "../types.ts";

type MonitorEntriesCollection = MonitorEntryRequestResponse<
  MonitorDataField
>["data"];

export const monitorEntriesCollectionSchema: JSONSchemaType<
  MonitorEntriesCollection
> = {
  type: "array",
  items: {
    oneOf: [
      monitorEntrySchema,
      monitorTemperatureEntrySchema,
      monitorPressureEntrySchema,
      monitorParticulatesEntrySchema,
    ],
  },
};

export const monitorEntryRequestResponseSchema: JSONSchemaType<
  MonitorEntryRequestResponse<MonitorDataField>
> = {
  type: "object",
  properties: {
    data: monitorEntriesCollectionSchema,
    page: {
      type: "number",
    },
    count: {
      type: "number",
    },
    pages: {
      type: "number",
    },
    has_next_page: {
      type: "boolean",
    },
    has_previous_page: {
      type: "boolean",
    },
  },
  required: [
    "data",
    "page",
    "count",
    "pages",
    "has_next_page",
    "has_previous_page",
  ],
};

export const validateMonitorEntriesCollection = schemaValidator(
  monitorEntriesCollectionSchema,
  { checkArray: true },
);

export const validateMonitorEntryRequestResponseSchema = schemaValidator(
  monitorEntryRequestResponseSchema,
);
//export function validateMonitorEntryRequestResponseSchema(
//  data: MonitorEntryRequestResponse<MonitorDataField>,
//  failureHandle: SchemaValidationFailureHandler<
//    MonitorEntryRequestResponse<MonitorDataField>
//  >,
//) {
//  const ajv = new Ajv();
//  const validate = ajv.compile(monitorEntryRequestResponseSchema);
//
//  const valid = validate(data);
//  if (!valid) {
//    failureHandle(validate.errors, data);
//  }
//}
