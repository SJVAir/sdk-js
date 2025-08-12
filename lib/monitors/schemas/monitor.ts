import { schemaValidator } from "../../schema.ts";

export const validateMonitorLatestSchema = schemaValidator(monitorLatestSchema);

export const validateMonitorClosestSchema = schemaValidator(
  monitorClosestSchema,
);

export const validateMonitorDetailsSchema = schemaValidator(
  monitorDetailsSchema,
);

export const validateCollocationSchema = schemaValidator(collocationSchema);
