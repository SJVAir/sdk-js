import * as z from "zod";

/**
 * The outcome of an alert evaluation:
 * - `ok`: a value and level were computed
 * - `insufficient`: under 50% of the expected readings, or an hourly feed's
 *   latest reading is older than twice its interval
 * - `no_data`: no readings, or an inactive monitor with no stored result
 * - `pending`: no stored result yet, for example just after a server cache
 *   restart
 */
export const monitorAlertStatusSchema: z.ZodEnum<{
  ok: "ok";
  insufficient: "insufficient";
  no_data: "no_data";
  pending: "pending";
}> = z.enum(["ok", "insufficient", "no_data", "pending"]);

interface MonitorAlertPreviousSchema extends
  z.ZodObject<{
    /** The status of the previous evaluation */
    status: typeof monitorAlertStatusSchema;
    /** The previous value, null unless its status was "ok" */
    value: z.ZodNullable<z.ZodNumber>;
    /** The previous level key, null unless its status was "ok" */
    level: z.ZodNullable<z.ZodString>;
  }> {}
const monitorAlertPreviousSchema: MonitorAlertPreviousSchema = z.object({
  status: monitorAlertStatusSchema,
  value: z.number().nullable(),
  level: z.string().nullable(),
});

interface MonitorAlertWindowSchema extends
  z.ZodObject<{
    /** The start of the averaging window (ISO 8601 with offset) */
    start: z.ZodString;
    /** The end of the averaging window (ISO 8601 with offset) */
    end: z.ZodString;
  }> {}
const monitorAlertWindowSchema: MonitorAlertWindowSchema = z.object({
  start: z.string(),
  end: z.string(),
});

interface MonitorAlertCurrentSchema extends
  z.ZodObject<{
    /** The outcome of the evaluation. See `monitorAlertStatusSchema`. */
    status: typeof monitorAlertStatusSchema;
    /** The trailing average, null unless status is "ok" */
    value: z.ZodNullable<z.ZodNumber>;
    /** The level key from the monitors/meta scale, null unless status is "ok" */
    level: z.ZodNullable<z.ZodString>;
    /** The averaging window, null when pending */
    window: z.ZodNullable<MonitorAlertWindowSchema>;
    /** The timestamp of the latest reading (ISO 8601 with offset), null when pending */
    latest_timestamp: z.ZodNullable<z.ZodString>;
    /** The number of readings in the window, null when pending */
    readings: z.ZodNullable<z.ZodNumber>;
    /** The number of readings required for an "ok" result, null when pending */
    required: z.ZodNullable<z.ZodNumber>;
    /** The previous evaluation, if any */
    previous: z.ZodNullable<MonitorAlertPreviousSchema>;
    /** When this result was evaluated (ISO 8601 with offset), null when pending */
    evaluated_at: z.ZodNullable<z.ZodString>;
  }> {}
/** One entry type's current alert result for a monitor */
export const monitorAlertCurrentSchema: MonitorAlertCurrentSchema = z.object({
  status: monitorAlertStatusSchema,
  value: z.number().nullable(),
  level: z.string().nullable(),
  window: monitorAlertWindowSchema.nullable(),
  latest_timestamp: z.string().nullable(),
  readings: z.number().nullable(),
  required: z.number().nullable(),
  previous: monitorAlertPreviousSchema.nullable(),
  evaluated_at: z.string().nullable(),
});

interface MonitorAlertCurrentRecordSchema
  extends z.ZodRecord<z.ZodString, typeof monitorAlertCurrentSchema> {}
/** Current alert results keyed by entry type id. A missing key means not evaluated. */
export const monitorAlertCurrentRecordSchema: MonitorAlertCurrentRecordSchema =
  z.record(z.string(), monitorAlertCurrentSchema);
