import * as z from "zod";
import { scaleSchema } from "../../meta/schemas/mod.ts";

interface CalHeatScoreMetaSchema extends
  z.ZodObject<{
    /** The scales CalHeatScore values are rated on, by id */
    scales: z.ZodRecord<z.ZodString, typeof scaleSchema>;
  }> {}
/** The metadata returned from calheatscore/meta */
export const calHeatScoreMetaSchema: CalHeatScoreMetaSchema = z.object({
  scales: z.record(z.string(), scaleSchema),
});
