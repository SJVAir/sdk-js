import * as z from "zod";
import {
  type RegionGeometrySchema,
  regionGeometrySchema,
} from "../../regions/schemas/region_geojson.ts";

/** The pesticide-use totals each map feature carries, for its year */
export const pesticideUseTotalsShape: PesticideUseTotalsShape = {
  lbs_chemical: z.number(),
  lbs_product: z.number(),
  acres_treated: z.number(),
  applications: z.number(),
  lbs_chemical_prev: z.optional(z.number()),
  lbs_product_prev: z.optional(z.number()),
  acres_treated_prev: z.optional(z.number()),
  applications_prev: z.optional(z.number()),
};

/** The shape of the totals a section or township feature carries */
export type PesticideUseTotalsShape = {
  /** Pounds of active ingredient; 0 when nothing was applied */
  lbs_chemical: z.ZodNumber;
  /** Pounds of product applied */
  lbs_product: z.ZodNumber;
  /** Acres treated */
  acres_treated: z.ZodNumber;
  /** The number of applications (an integer) */
  applications: z.ZodNumber;
  /** `lbs_chemical` for the `compare` year; sent only with `compare` */
  lbs_chemical_prev: z.ZodOptional<z.ZodNumber>;
  /** `lbs_product` for the `compare` year; sent only with `compare` */
  lbs_product_prev: z.ZodOptional<z.ZodNumber>;
  /** `acres_treated` for the `compare` year; sent only with `compare` */
  acres_treated_prev: z.ZodOptional<z.ZodNumber>;
  /** `applications` for the `compare` year; sent only with `compare` */
  applications_prev: z.ZodOptional<z.ZodNumber>;
};

/** One figure's color classes */
export interface PesticideUseClassSchema extends
  z.ZodObject<{
    /**
     * Each class's inclusive upper bound, ascending: up to 8, fewer when the
     * values are few. Zero is no data and belongs to no class. Empty when no
     * feature has a positive value.
     */
    breaks: z.ZodArray<z.ZodNumber>;
    /** The smallest positive value, or null when there is none */
    min: z.ZodNullable<z.ZodNumber>;
    /**
     * Each class's fill, in break order: one per break, empty when `breaks`
     * is. Draw a value of 0 (no data) with `getPesticidesMeta().ramp.no_data`.
     */
    colors: z.ZodArray<z.ZodString>;
  }> {}

export const pesticideUseClassSchema: PesticideUseClassSchema = z.object({
  breaks: z.array(z.number()),
  min: z.nullable(z.number()),
  colors: z.array(z.string()),
});

/**
 * The valley-wide color classes for each figure, sent with `classes: true`.
 * They rank every feature in the valley for the year, month and value
 * filters; the area and `county` never change them, so a color means the same
 * range anywhere on the map.
 */
export interface PesticideUseClassesSchema extends
  z.ZodObject<{
    lbs_chemical: PesticideUseClassSchema;
    acres_treated: PesticideUseClassSchema;
    applications: PesticideUseClassSchema;
  }> {}

export const pesticideUseClassesSchema: PesticideUseClassesSchema = z.object({
  lbs_chemical: pesticideUseClassSchema,
  acres_treated: pesticideUseClassSchema,
  applications: pesticideUseClassSchema,
});

/** The year a map response covers: a year, every year, or null with no data loaded */
export type PesticideMapYearSchema = z.ZodNullable<
  z.ZodUnion<readonly [z.ZodNumber, z.ZodLiteral<"all">]>
>;

const pesticideMapYearSchema: PesticideMapYearSchema = z.nullable(
  z.union([z.number(), z.literal("all")]),
);

/** The properties of one MTRS section on the map */
export interface PesticideSectionPropertiesSchema extends
  z.ZodObject<
    {
      /** The section's id, for `getPesticideSectionDetails` */
      id: z.ZodString;
      /** The section's MTRS code */
      mtrs: z.ZodString;
      /** The name of the county its use is filed under, or null */
      county: z.ZodNullable<z.ZodString>;
    } & PesticideUseTotalsShape
  > {}

export const pesticideSectionPropertiesSchema:
  PesticideSectionPropertiesSchema = z.object({
    id: z.string(),
    mtrs: z.string(),
    county: z.nullable(z.string()),
    ...pesticideUseTotalsShape,
  });

/** One MTRS section (a square mile) as a GeoJSON feature */
export interface PesticideSectionFeatureSchema extends
  z.ZodObject<{
    type: z.ZodLiteral<"Feature">;
    /** The section's id, same as `properties.id` */
    id: z.ZodString;
    /** The section's outline, or null when fetched with `geometry: false` */
    geometry: z.ZodNullable<RegionGeometrySchema>;
    properties: PesticideSectionPropertiesSchema;
  }> {}

export const pesticideSectionFeatureSchema: PesticideSectionFeatureSchema = z
  .object({
    type: z.literal("Feature"),
    id: z.string(),
    geometry: z.nullable(regionGeometrySchema),
    properties: pesticideSectionPropertiesSchema,
  });

/** The sections `getPesticideSections` returns */
export interface PesticideSectionCollectionSchema extends
  z.ZodObject<{
    type: z.ZodLiteral<"FeatureCollection">;
    /** The year the totals cover */
    year: PesticideMapYearSchema;
    /** The color classes; sent only with `classes: true` */
    classes: z.ZodOptional<PesticideUseClassesSchema>;
    features: z.ZodArray<PesticideSectionFeatureSchema>;
  }> {}

export const pesticideSectionCollectionSchema:
  PesticideSectionCollectionSchema = z.object({
    type: z.literal("FeatureCollection"),
    year: pesticideMapYearSchema,
    classes: z.optional(pesticideUseClassesSchema),
    features: z.array(pesticideSectionFeatureSchema),
  });

/** The properties of one PLSS township on the map */
export interface PesticideTownshipPropertiesSchema extends
  z.ZodObject<
    {
      /**
       * The township's PLSS designation, e.g. `MDM-T14S-R20E`. It is
       * permanent: it changes only if the MTRS sections are reimported under
       * different names.
       */
      id: z.ZodString;
      /** The same as `id` */
      name: z.ZodString;
      /** How many MTRS sections make up the township (up to 36) */
      sections: z.ZodNumber;
    } & PesticideUseTotalsShape
  > {}

export const pesticideTownshipPropertiesSchema:
  PesticideTownshipPropertiesSchema = z.object({
    id: z.string(),
    name: z.string(),
    sections: z.number(),
    ...pesticideUseTotalsShape,
  });

/** One PLSS township (a 6x6 block of sections) as a GeoJSON feature */
export interface PesticideTownshipFeatureSchema extends
  z.ZodObject<{
    type: z.ZodLiteral<"Feature">;
    /** The township's PLSS designation, same as `properties.id` */
    id: z.ZodString;
    /** The township's outline, or null when fetched with `geometry: false` */
    geometry: z.ZodNullable<RegionGeometrySchema>;
    properties: PesticideTownshipPropertiesSchema;
  }> {}

export const pesticideTownshipFeatureSchema: PesticideTownshipFeatureSchema = z
  .object({
    type: z.literal("Feature"),
    id: z.string(),
    geometry: z.nullable(regionGeometrySchema),
    properties: pesticideTownshipPropertiesSchema,
  });

/** The townships `getPesticideTownships` returns */
export interface PesticideTownshipCollectionSchema extends
  z.ZodObject<{
    type: z.ZodLiteral<"FeatureCollection">;
    /** The year the totals cover */
    year: PesticideMapYearSchema;
    /** The color classes; sent only with `classes: true` */
    classes: z.ZodOptional<PesticideUseClassesSchema>;
    features: z.ZodArray<PesticideTownshipFeatureSchema>;
  }> {}

export const pesticideTownshipCollectionSchema:
  PesticideTownshipCollectionSchema = z.object({
    type: z.literal("FeatureCollection"),
    year: pesticideMapYearSchema,
    classes: z.optional(pesticideUseClassesSchema),
    features: z.array(pesticideTownshipFeatureSchema),
  });
