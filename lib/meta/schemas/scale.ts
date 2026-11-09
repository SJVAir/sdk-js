import * as z from "zod";

interface ScaleSourceSchema extends
  z.ZodObject<{
    /** The name of the organization or standard the scale comes from */
    name: z.ZodString;
    /** A URL for the source's documentation */
    url: z.ZodString;
  }> {}
/** Where a scale's breakpoints come from */
export const scaleSourceSchema: ScaleSourceSchema = z.object({
  name: z.string(),
  url: z.string(),
});

interface ScaleLevelSchema extends
  z.ZodObject<{
    /** The permanent key of this level */
    key: z.ZodString;
    /** The level in presentation form */
    label: z.ZodString;
    /** The color representing this level, if any */
    color: z.ZodNullable<z.ZodString>;
    /** The opacity to draw the color with, if any */
    opacity: z.ZodNullable<z.ZodNumber>;
    /** The rank of this level; 0 is the lowest */
    tier: z.ZodNullable<z.ZodNumber>;
    /** A sentence describing the level, or an empty string */
    description: z.ZodString;
    /** Advice that accompanies the level, or an empty string */
    guidance: z.ZodString;
    /** The inclusive lower bound of a range level */
    min: z.ZodNullable<z.ZodNumber>;
    /** The upper bound of a range level */
    max: z.ZodNullable<z.ZodNumber>;
    /** The value a category level stands for */
    value: z.ZodNullable<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
  }> {}
/** One level (breakpoint or category) of a scale */
export const scaleLevelSchema: ScaleLevelSchema = z.object({
  key: z.string(),
  label: z.string(),
  color: z.string().nullable(),
  opacity: z.number().nullable(),
  tier: z.number().nullable(),
  description: z.string(),
  guidance: z.string(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  value: z.union([z.string(), z.number()]).nullable(),
});

/** The name of a daily summary row field a scale judges a day by */
export type DailyStatisticSchema = z.ZodEnum<{
  mean_24h: "mean_24h";
  max_1h: "max_1h";
  max_8h: "max_8h";
}>;
/**
 * The daily summary row fields a scale can judge a day by: `mean_24h` (the
 * 24-hour average), `max_1h` (the highest 1-hour average) and `max_8h` (the
 * highest 8-hour average)
 */
export const dailyStatisticSchema: DailyStatisticSchema = z.enum([
  "mean_24h",
  "max_1h",
  "max_8h",
]);

interface ScaleSchema extends
  z.ZodObject<{
    /** The permanent id of this scale */
    id: z.ZodString;
    /** The scale in presentation form */
    label: z.ZodString;
    /** The presentable unit of measurement, or an empty string */
    units: z.ZodString;
    /** Whether levels are value ranges or discrete categories */
    kind: z.ZodEnum<{ range: "range"; category: "category" }>;
    /** Where the scale comes from, if stated */
    source: z.ZodNullable<ScaleSourceSchema>;
    /**
     * The standard's averaging window in hours: 24 for PM2.5 and PM10, 1 for
     * O3, NO2 and SO2, 8 for CO; `null` for AQI, category scales and weather
     */
    averaging_hours: z.ZodNullable<
      z.ZodUnion<readonly [z.ZodLiteral<24>, z.ZodLiteral<1>, z.ZodLiteral<8>]>
    >;
    /**
     * The daily summary row field that judges a day against this scale
     * (`mean_24h`, `max_1h` or `max_8h`), or `null` when none does
     */
    daily_statistic: z.ZodNullable<DailyStatisticSchema>;
    /**
     * The translated display text for `daily_statistic` ("24-hour average",
     * "Highest 1-hour average", "Highest 8-hour average"), or `null` when
     * `daily_statistic` is `null`
     */
    daily_statistic_label: z.ZodNullable<z.ZodString>;
    /** The levels, in order */
    levels: z.ZodArray<ScaleLevelSchema>;
  }> {}
/** A scale that turns a value into a named, colored level */
export const scaleSchema: ScaleSchema = z.object({
  id: z.string(),
  label: z.string(),
  units: z.string(),
  kind: z.enum(["range", "category"]),
  source: scaleSourceSchema.nullable(),
  averaging_hours: z.union([z.literal(24), z.literal(1), z.literal(8)])
    .nullable(),
  daily_statistic: dailyStatisticSchema.nullable(),
  daily_statistic_label: z.string().nullable(),
  levels: z.array(scaleLevelSchema),
});

interface ChoiceSchema extends
  z.ZodObject<{
    /** The permanent key of this choice */
    key: z.ZodString;
    /** The choice in presentation form */
    label: z.ZodString;
    /** A sentence describing the choice */
    description: z.ZodString;
  }> {}
/** A documented option, such as a data stage or a processor */
export const choiceSchema: ChoiceSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
});
