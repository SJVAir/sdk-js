import * as z from "zod";
import {
  type PesticideBadgeSchema,
  pesticideBadgeSchema,
  type PesticideNoteSchema,
  pesticideNoteSchema,
} from "./badge.ts";
import {
  type AerialGroundFilterSchema,
  aerialGroundFilterSchema,
} from "./aerial_ground.ts";
import { type IARCGroupSchema, iarcGroupSchema } from "./iarc_group.ts";
import { type PesticideNarrowSchema, pesticideNarrowSchema } from "./narrow.ts";

interface PesticideCategoryMetaSchema extends
  z.ZodObject<{
    /** The category's key, as `category` filters and chemical rows use it */
    key: z.ZodString;
    /** The category's name */
    label: z.ZodString;
    /** A short plain-language explanation, from the health notes */
    description: z.ZodString;
    /** False for the categories no import assigns to any chemical */
    in_use: z.ZodBoolean;
  }> {}
const pesticideCategoryMetaSchema: PesticideCategoryMetaSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  in_use: z.boolean(),
});

interface PesticideIARCGroupMetaSchema extends
  z.ZodObject<{
    /** The IARC group, as `iarc_group` filters and chemical rows use it */
    key: IARCGroupSchema;
    /** The group's name, e.g. "Group 2A" */
    label: z.ZodString;
    /** What the group means, e.g. "Probably carcinogenic to humans" */
    description: z.ZodString;
  }> {}
const pesticideIARCGroupMetaSchema: PesticideIARCGroupMetaSchema = z.object({
  key: iarcGroupSchema,
  label: z.string(),
  description: z.string(),
});

interface PesticideMethodMetaSchema extends
  z.ZodObject<{
    /** The method, as `aerial_ground` filters use it; `none` is not reported */
    key: AerialGroundFilterSchema;
    /** The method's name, e.g. "Ground" */
    label: z.ZodString;
  }> {}
const pesticideMethodMetaSchema: PesticideMethodMetaSchema = z.object({
  key: aerialGroundFilterSchema,
  label: z.string(),
});

interface PesticideNarrowMetaSchema extends
  z.ZodObject<{
    /** The narrowing, as `narrow` filters use it */
    key: PesticideNarrowSchema;
    /** The narrowing's name */
    label: z.ZodString;
    /** What the narrowing keeps */
    description: z.ZodString;
  }> {}
const pesticideNarrowMetaSchema: PesticideNarrowMetaSchema = z.object({
  key: pesticideNarrowSchema,
  label: z.string(),
  description: z.string(),
});

interface PesticidePlaceholderChemicalSchema extends
  z.ZodObject<{
    /** The chemical's id */
    id: z.ZodString;
    /** The chemical's CDPR name, e.g. "UNKNOWN" */
    name: z.ZodString;
  }> {}
const pesticidePlaceholderChemicalSchema: PesticidePlaceholderChemicalSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  });

export interface PesticidesMetaSchema extends
  z.ZodObject<{
    /** Every chemical category, including ones no chemical has yet */
    categories: z.ZodArray<PesticideCategoryMetaSchema>;
    /** The IARC carcinogenicity groups */
    iarc_groups: z.ZodArray<PesticideIARCGroupMetaSchema>;
    /** The use records' application methods (not spray-notice methods) */
    methods: z.ZodArray<PesticideMethodMetaSchema>;
    /** The narrowings `narrow` takes */
    narrows: z.ZodArray<PesticideNarrowMetaSchema>;
    /** CDPR's stand-ins for an unnamed ingredient, which carry no pounds */
    placeholder_chemicals: z.ZodArray<PesticidePlaceholderChemicalSchema>;
    /**
     * Every explainer note, keyed by note key. The server guarantees
     * `noi_meaning`, `pur_lag` (when use data is released), `badges`,
     * `prop65`, `carb_tac`, `iarc_1`, `iarc_2a`, `iarc_2b`, `iarc_3` and
     * `california_restricted`, and may serve more.
     */
    notes: z.ZodRecord<z.ZodString, PesticideNoteSchema>;
    /** The chemical classification badges, in display order */
    badges: z.ZodArray<PesticideBadgeSchema>;
    /** Links the pages show */
    links: z.ZodObject<{
      /** Where to sign up for SprayDays notices */
      spraydays_signup: z.ZodString;
    }>;
    /**
     * The value filters the notice endpoints accept, e.g. `chemical_id`,
     * `category` and `aerial_ground`
     */
    notice_filters: z.ZodArray<z.ZodString>;
  }> {}

/**
 * Labels and descriptions for the values the pesticide endpoints filter on,
 * as returned from pesticides/meta. Keys are permanent; labels may change.
 */
export const pesticidesMetaSchema: PesticidesMetaSchema = z.object({
  categories: z.array(pesticideCategoryMetaSchema),
  iarc_groups: z.array(pesticideIARCGroupMetaSchema),
  methods: z.array(pesticideMethodMetaSchema),
  narrows: z.array(pesticideNarrowMetaSchema),
  placeholder_chemicals: z.array(pesticidePlaceholderChemicalSchema),
  notes: z.record(z.string(), pesticideNoteSchema),
  badges: z.array(pesticideBadgeSchema),
  links: z.object({ spraydays_signup: z.string() }),
  notice_filters: z.array(z.string()),
});
