import { Ajv, type JSONSchemaType } from "ajv";
import type { SchemaValidationFailureHandler } from "../../schema.ts";
import type { MonitorEntryRequestResponse } from "../fetch_monitor_entries/types.ts";
import {
  monitorEntrySchema,
  monitorParticulatesEntrySchema,
  monitorPressureEntrySchema,
  monitorTemperatureEntrySchema,
} from "./monitor.ts";
import type { MonitorDataField } from "../types.ts";

export const monitorEntryRequestResponse: JSONSchemaType<
  MonitorEntryRequestResponse<MonitorDataField>
> = {
  type: "object",
  properties: {
    data: {
      type: "array",
      items: {
        oneOf: [
          monitorEntrySchema,
          monitorTemperatureEntrySchema,
          monitorPressureEntrySchema,
          monitorParticulatesEntrySchema,
        ],
      },
    },
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

export function validateMonitorEntryRequestResponseSchema(
  data: MonitorEntryRequestResponse<MonitorDataField>,
  failureHandle: SchemaValidationFailureHandler<
    MonitorEntryRequestResponse<MonitorDataField>
  >,
) {
  const ajv = new Ajv();
  const validate = ajv.compile(monitorEntryRequestResponse);

  const valid = validate(data);
  if (!valid) {
    failureHandle(validate.errors, data);
  }
}
