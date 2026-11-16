import * as z from "zod";
import { openEnum, type OpenEnumSchema } from "../../schema.ts";

/**
 * A chemical classification badge's key, as `getPesticidesMeta().badges` lists
 * them: a known key, or any badge the server adds later. Keys are permanent.
 */
export type PesticideBadgeKeySchema = OpenEnumSchema<
  readonly [
    "prop65",
    "carb_tac",
    "iarc_1",
    "iarc_2a",
    "iarc_2b",
    "iarc_3",
    "california_restricted",
  ]
>;

export const pesticideBadgeKeySchema: PesticideBadgeKeySchema = openEnum(
  [
    "prop65",
    "carb_tac",
    "iarc_1",
    "iarc_2a",
    "iarc_2b",
    "iarc_3",
    "california_restricted",
  ] as const,
);

/** One classification badge, in display order */
export interface PesticideBadgeSchema extends
  z.ZodObject<{
    /** The badge's permanent key */
    key: PesticideBadgeKeySchema;
    /** The badge's short label, e.g. "Prop 65" */
    label: z.ZodString;
    /** The key of the note (in `notes`) that explains the badge */
    note: z.ZodString;
  }> {}

export const pesticideBadgeSchema: PesticideBadgeSchema = z.object({
  key: pesticideBadgeKeySchema,
  label: z.string(),
  note: z.string(),
});

/** A plain-language explainer note, from the server's health notes */
export interface PesticideNoteSchema extends
  z.ZodObject<{
    /** The note's key (the same as its key in `notes`) */
    key: z.ZodString;
    title: z.ZodString;
    /** A short summary */
    summary: z.ZodString;
    /** A longer explanation; null when the note has none */
    detail: z.ZodNullable<z.ZodString>;
    /** Where the note's facts come from */
    source_url: z.ZodString;
  }> {}

export const pesticideNoteSchema: PesticideNoteSchema = z.object({
  key: z.string(),
  title: z.string(),
  summary: z.string(),
  detail: z.nullable(z.string()),
  source_url: z.string(),
});
