import * as z from "zod";
import { type MultiPolygonSchema, multiPolygonSchema } from "../../schema.ts";
import { placeSchema } from "../../meta/schemas/mod.ts";

const smokeDensitySchema = z.enum(["light", "medium", "heavy"]);

export interface HMSSmokeSchema extends
  z.ZodObject<{
    /** The unique identifier for the smoke event */
    id: z.ZodString;
    /** The satellite from which the smoke data was obtained */
    satellite: z.ZodString;
    /** The density of the smoke, which can be "light", "medium", or "heavy" */
    density: z.ZodEnum<{ light: "light"; medium: "medium"; heavy: "heavy" }>;
    /** The end time of the smoke event in ISO 8601 format */
    end: z.ZodString;
    /** The start time of the smoke event in ISO 8601 format */
    start: z.ZodString;
    /** The date of the smoke event in YYYY-MM-DD format */
    date: z.ZodString;
    /** The geographical representation of the smoke event as a MultiPolygon */
    geometry: MultiPolygonSchema;
  }> {}

export const hmsSmokeSchema: HMSSmokeSchema = z.object({
  id: z.string(),
  satellite: z.string(),
  density: smokeDensitySchema,
  end: z.string(),
  start: z.string(),
  date: z.string(),
  geometry: multiPolygonSchema,
});

interface SmokeCoverageSchema extends
  z.ZodObject<{
    /** Share of the place under light smoke, 0 to 1 */
    light: z.ZodNumber;
    /** Share of the place under medium smoke, 0 to 1 */
    medium: z.ZodNumber;
    /** Share of the place under heavy smoke, 0 to 1 */
    heavy: z.ZodNumber;
  }> {}
const smokeCoverageSchema: SmokeCoverageSchema = z.object({
  light: z.number(),
  medium: z.number(),
  heavy: z.number(),
});

export interface SmokeDaySchema extends
  z.ZodObject<{
    /** The Pacific calendar date, `YYYY-MM-DD` */
    date: z.ZodString;
    /** The heaviest smoke over the place that day, or `null` when there was none */
    density: z.ZodNullable<
      z.ZodEnum<{ light: "light"; medium: "medium"; heavy: "heavy" }>
    >;
    /** The share of the place covered by each density */
    coverage: SmokeCoverageSchema;
  }> {}
/** One day of smoke over a place */
export const smokeDaySchema: SmokeDaySchema = z.object({
  date: z.string(),
  density: smokeDensitySchema.nullable(),
  coverage: smokeCoverageSchema,
});

export interface SmokeForPlaceSchema extends
  z.ZodObject<{
    /** The place asked about */
    place: typeof placeSchema;
    /** One entry per date in the range */
    days: z.ZodArray<SmokeDaySchema>;
  }> {}
/** The smoke over a place by day, as returned from hms/smoke/place */
export const smokeForPlaceSchema: SmokeForPlaceSchema = z.object({
  place: placeSchema,
  days: z.array(smokeDaySchema),
});
