import * as z from "zod";
import { type GeoJSONPointSchema, geoJSONPointSchema } from "../../schema.ts";

interface ActivePesticideNoticeChemicalSchema extends
  z.ZodObject<{
    /** The chemical's id, as `chemical_id` filters take it */
    id: z.ZodString;
    /** The chemical's CDPR name */
    name: z.ZodString;
    /** The chemical's name for display */
    display_name: z.ZodString;
    /** Whether the chemical is one of concern (Prop 65, CARB TAC, IARC, restricted) */
    is_of_concern: z.ZodBoolean;
  }> {}

const activePesticideNoticeChemicalSchema: ActivePesticideNoticeChemicalSchema =
  z.object({
    id: z.string(),
    name: z.string(),
    display_name: z.string(),
    is_of_concern: z.boolean(),
  });

interface ActivePesticideNoticeProductSchema extends
  z.ZodObject<{
    /** The product's id, as `product_id` filters take it */
    id: z.ZodString;
    /** The product's name */
    name: z.ZodString;
  }> {}

const activePesticideNoticeProductSchema: ActivePesticideNoticeProductSchema = z
  .object({ id: z.string(), name: z.string() });

/** The properties of one spray notice on the map */
export interface ActivePesticideNoticePropertiesSchema extends
  z.ZodObject<{
    /** The notice's id */
    id: z.ZodString;
    /** When the application is scheduled (ISO 8601) */
    scheduled_application: z.ZodString;
    /** When the notice's window ends: four days after the scheduled time */
    scheduled_end: z.ZodString;
    /** The county's name, or null */
    county: z.ZodNullable<z.ZodString>;
    /** SprayDays' wording for the method, e.g. "Ground"; may be empty */
    application_method: z.ZodString;
    /** The amount treated, or null */
    treated_amount: z.ZodNullable<z.ZodNumber>;
    /** The units of the treated amount; may be empty */
    treated_units: z.ZodString;
    /** The MTRS section's name, or null */
    section: z.ZodNullable<z.ZodString>;
    /** The MTRS section's id (for `getPesticideSectionDetails`), or null */
    section_id: z.ZodNullable<z.ZodString>;
    /** The products named in the notice */
    products: z.ZodArray<ActivePesticideNoticeProductSchema>;
    /** The active ingredients of those products */
    chemicals: z.ZodArray<ActivePesticideNoticeChemicalSchema>;
    /**
     * Whether the notice's window has ended. Sent only when the request gave
     * a `date`.
     */
    past: z.ZodOptional<z.ZodBoolean>;
  }> {}

export const activePesticideNoticePropertiesSchema:
  ActivePesticideNoticePropertiesSchema = z.object({
    id: z.string(),
    scheduled_application: z.string(),
    scheduled_end: z.string(),
    county: z.nullable(z.string()),
    application_method: z.string(),
    treated_amount: z.nullable(z.number()),
    treated_units: z.string(),
    section: z.nullable(z.string()),
    section_id: z.nullable(z.string()),
    products: z.array(activePesticideNoticeProductSchema),
    chemicals: z.array(activePesticideNoticeChemicalSchema),
    past: z.optional(z.boolean()),
  });

/** A GeoJSON Point feature for one spray notice */
export interface ActivePesticideNoticeFeatureSchema extends
  z.ZodObject<{
    type: z.ZodLiteral<"Feature">;
    id: z.ZodString;
    /** The notice's location, or null when it has none */
    geometry: z.ZodNullable<GeoJSONPointSchema>;
    properties: ActivePesticideNoticePropertiesSchema;
  }> {}

export const activePesticideNoticeFeatureSchema:
  ActivePesticideNoticeFeatureSchema = z.object({
    type: z.literal("Feature"),
    id: z.string(),
    geometry: z.nullable(geoJSONPointSchema),
    properties: activePesticideNoticePropertiesSchema,
  });

/** The GeoJSON FeatureCollection `pesticides/notices/active/` answers with */
export interface ActivePesticideNoticeCollectionSchema extends
  z.ZodObject<{
    type: z.ZodLiteral<"FeatureCollection">;
    /** When the server built the response (ISO 8601) */
    as_of: z.ZodString;
    features: z.ZodArray<ActivePesticideNoticeFeatureSchema>;
  }> {}

export const activePesticideNoticeCollectionSchema:
  ActivePesticideNoticeCollectionSchema = z.object({
    type: z.literal("FeatureCollection"),
    as_of: z.string(),
    features: z.array(activePesticideNoticeFeatureSchema),
  });
