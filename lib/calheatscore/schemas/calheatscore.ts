import * as z from "zod";
import { placeSchema } from "../../meta/schemas/mod.ts";

interface CalHeatScoreSchema extends
  z.ZodObject<{
    /** The ZIP code the score is for */
    zipcode: z.ZodString;
    /** The Pacific calendar date, `YYYY-MM-DD` */
    date: z.ZodString;
    /** The heat score */
    score: z.ZodNumber;
    /** The name of the score's level, such as `Low` */
    score_display: z.ZodString;
  }> {}
/** One ZIP code's heat score for a day */
export const calHeatScoreSchema: CalHeatScoreSchema = z.object({
  zipcode: z.string(),
  date: z.string(),
  score: z.number(),
  score_display: z.string(),
});

interface HeatForPlaceSchema extends
  z.ZodObject<{
    /** The place asked about */
    place: typeof placeSchema;
    /** How many ZIP codes the place covers */
    zip_count: z.ZodNumber;
    /** The heat scores of the place's ZIP codes, by day */
    days: z.ZodArray<CalHeatScoreSchema>;
  }> {}
/** The heat scores for a place, as returned from calheatscore/place */
export const heatForPlaceSchema: HeatForPlaceSchema = z.object({
  place: placeSchema,
  zip_count: z.number(),
  days: z.array(calHeatScoreSchema),
});
