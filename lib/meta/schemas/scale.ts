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
