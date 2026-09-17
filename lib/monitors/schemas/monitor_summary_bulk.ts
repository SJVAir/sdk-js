import * as z from "zod";
import { monitorDataSchema } from "./monitor_data.ts";
import {
  type MonitorSummarySchema,
  monitorSummarySchema,
} from "./monitor_summary.ts";

export interface MonitorWithSummariesSchema extends
  z.ZodObject<
    (typeof monitorDataSchema)["shape"] & {
      /** The summary rows for this monitor within the requested range/page */
      summaries: z.ZodArray<MonitorSummarySchema>;
    }
  > {}

export const monitorWithSummariesSchema: MonitorWithSummariesSchema =
  monitorDataSchema.extend({ summaries: z.array(monitorSummarySchema) });
