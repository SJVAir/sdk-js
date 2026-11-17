import * as z from "zod";
import { scaleSchema } from "../../meta/schemas/mod.ts";
import { openEnum, type OpenEnumSchema } from "../../schema.ts";
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

/**
 * The value that fills a link's query parameter (see the server's fill rule on
 * `link_params`): a known source, or any newer one.
 */
export type PesticideLinkSourceSchema = OpenEnumSchema<
  readonly [
    "year",
    "month_start",
    "month_end",
    "chemical_id",
    "product_id",
    "commodity_id",
    "aerial_ground",
    "narrow",
    "notices_year",
    "notices_month",
  ]
>;

export const pesticideLinkSourceSchema: PesticideLinkSourceSchema = openEnum(
  [
    "year",
    "month_start",
    "month_end",
    "chemical_id",
    "product_id",
    "commodity_id",
    "aerial_ground",
    "narrow",
    "notices_year",
    "notices_month",
  ] as const,
);

export interface PesticideLinkParamSchema extends
  z.ZodObject<{
    /** The query parameter the explorer page takes, e.g. `chemical` */
    param: z.ZodString;
    /** The value that fills it, e.g. `chemical_id` */
    from: PesticideLinkSourceSchema;
  }> {}

/** One query parameter an explorer link takes, and the value that fills it */
export const pesticideLinkParamSchema: PesticideLinkParamSchema = z.object({
  param: z.string(),
  from: pesticideLinkSourceSchema,
});

type PesticideLinkParamsSchema = z.ZodArray<PesticideLinkParamSchema>;

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
     * `prop65`, `carb_tac`, `iarc_1`, `iarc_2a`, `iarc_2b`, `iarc_3`,
     * `california_restricted` and `shades_valley` (the section and township
     * maps' legend), and may serve more.
     */
    notes: z.ZodRecord<z.ZodString, PesticideNoteSchema>;
    /** The chemical classification badges, in display order */
    badges: z.ZodArray<PesticideBadgeSchema>;
    /**
     * Links the pages show. All are absolute URLs. The explorer links are
     * templates: `{id}` is a section's or chemical's id, and `link_params`
     * lists the query parameters each takes. Fill them with
     * `pesticideLinkUrl`.
     */
    links: z.ZodObject<{
      /** Where to sign up for SprayDays notices */
      spraydays_signup: z.ZodString;
      /** The explorer's page for a section (`{id}`: the section's id) */
      section_page: z.ZodString;
      /** The explorer's use records in a section */
      section_records: z.ZodString;
      /** The explorer's upcoming spray notices in a section */
      section_notices: z.ZodString;
      /** The explorer's past spray notices in a section, by month */
      section_notices_past: z.ZodString;
      /** The explorer's page for a chemical (`{id}`: the chemical's id) */
      chemical_page: z.ZodString;
    }>;
    /**
     * For each explorer link in `links`, the query parameters its page takes,
     * in order, and the value that fills each one
     */
    link_params: z.ZodObject<{
      section_page: PesticideLinkParamsSchema;
      section_records: PesticideLinkParamsSchema;
      section_notices: PesticideLinkParamsSchema;
      section_notices_past: PesticideLinkParamsSchema;
      chemical_page: PesticideLinkParamsSchema;
    }>;
    /**
     * The value filters the notice endpoints accept, e.g. `chemical_id`,
     * `category` and `aerial_ground`
     */
    notice_filters: z.ZodArray<z.ZodString>;
    /** The years with pesticide-use data, newest first */
    years: z.ZodArray<z.ZodNumber>;
    /** The section and township maps' color ramp and no-data color */
    ramp: z.ZodObject<{
      /**
       * The ramp's 8 stops, lightest first, for reference. Fill the map's
       * classes from `classes.<figure>.colors`, which the server samples
       * from this ramp for however many classes there are.
       */
      colors: z.ZodArray<z.ZodString>;
      /** The color for no data (a value of 0) */
      no_data: z.ZodString;
    }>;
    /**
     * The scales the pesticide map's layers are drawn with, by id:
     * `spray-notice` (one category level, the notice marker's color)
     */
    scales: z.ZodRecord<z.ZodString, typeof scaleSchema>;
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
  links: z.object({
    spraydays_signup: z.string(),
    section_page: z.string(),
    section_records: z.string(),
    section_notices: z.string(),
    section_notices_past: z.string(),
    chemical_page: z.string(),
  }),
  link_params: z.object({
    section_page: z.array(pesticideLinkParamSchema),
    section_records: z.array(pesticideLinkParamSchema),
    section_notices: z.array(pesticideLinkParamSchema),
    section_notices_past: z.array(pesticideLinkParamSchema),
    chemical_page: z.array(pesticideLinkParamSchema),
  }),
  notice_filters: z.array(z.string()),
  years: z.array(z.number()),
  ramp: z.object({ colors: z.array(z.string()), no_data: z.string() }),
  scales: z.record(z.string(), scaleSchema),
});
