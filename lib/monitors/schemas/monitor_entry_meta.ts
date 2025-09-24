import * as z from "zod";
import {
  type MonitorEntryTypeSchema,
  monitorEntryTypeSchema,
} from "./monitor_entry_type.ts";

export interface MonitorEntryMetaSchema extends
  z.ZodObject<{
    /** The specific sensor on a dual sensor monitor which this entry came from */
    sensor: z.ZodString;

    /** The timestamp at which this entry was recieved */
    timestamp: z.ZodString;

    /** The stage at which this entry is currently processed */
    stage: z.ZodString;

    /** The processor, if any, for the current entry */
    processor: z.ZodString;

    /** The type of data this entry represents */
    entry_type: MonitorEntryTypeSchema;
  }> {}

export const monitorEntryMetaSchema: MonitorEntryMetaSchema = z.object({
  sensor: z.string(),
  timestamp: z.string(),
  stage: z.string(),
  processor: z.string(),
  entry_type: monitorEntryTypeSchema,
});
