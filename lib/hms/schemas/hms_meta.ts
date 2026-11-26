import * as z from "zod";
import { scaleSchema } from "../../meta/schemas/mod.ts";

interface HMSMetaSchema extends
  z.ZodObject<{
    /** The scales HMS smoke and fire are rated on, by id */
    scales: z.ZodRecord<z.ZodString, typeof scaleSchema>;
  }> {}
/** The metadata returned from hms/meta */
export const hmsMetaSchema: HMSMetaSchema = z.object({
  scales: z.record(z.string(), scaleSchema),
});
