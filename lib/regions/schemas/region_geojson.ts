import * as z from "zod";
import { type RegionRetiredSchema, retiredRegionSchema } from "./region.ts";
import { type RegionTypeSchema, regionTypeSchema } from "./region_type.ts";

interface PolygonGeometrySchema extends
  z.ZodObject<{
    type: z.ZodLiteral<"Polygon">;
    /** Rings of `[longitude, latitude]` positions: the outline, then any holes */
    coordinates: z.ZodArray<z.ZodArray<z.ZodArray<z.ZodNumber>>>;
  }> {}

interface MultiPolygonGeometrySchema extends
  z.ZodObject<{
    type: z.ZodLiteral<"MultiPolygon">;
    /** One set of rings per polygon */
    coordinates: z.ZodArray<z.ZodArray<z.ZodArray<z.ZodArray<z.ZodNumber>>>>;
  }> {}

/** The longitude/latitude geometry of a region's shape */
export type RegionGeometrySchema = z.ZodDiscriminatedUnion<
  [PolygonGeometrySchema, MultiPolygonGeometrySchema],
  "type"
>;

export const regionGeometrySchema: RegionGeometrySchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("Polygon"),
      coordinates: z.array(z.array(z.array(z.number()))),
    }),
    z.object({
      type: z.literal("MultiPolygon"),
      coordinates: z.array(z.array(z.array(z.array(z.number())))),
    }),
  ]);

export interface RegionFeaturePropertiesSchema extends
  z.ZodObject<{
    /** The ID of the region */
    id: z.ZodString;
    /** The name of the region */
    name: z.ZodString;
    /** The URL-safe slug of the region */
    slug: z.ZodString;
    /** The type of geography this region represents */
    type: RegionTypeSchema;
    /** The region's permanent official code, if it has one */
    external_id: z.ZodNullable<z.ZodString>;
    /** Set when the region has been retired; its code still resolves */
    retired: z.ZodNullable<RegionRetiredSchema>;
  }> {}

/** What a region's GeoJSON feature carries besides its shape */
export const regionFeaturePropertiesSchema: RegionFeaturePropertiesSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    type: regionTypeSchema,
    external_id: z.nullable(z.string()),
    retired: z.nullable(retiredRegionSchema),
  });

export interface RegionFeatureSchema extends
  z.ZodObject<{
    type: z.ZodLiteral<"Feature">;
    /** The ID of the region, same as `properties.id` */
    id: z.ZodString;
    geometry: RegionGeometrySchema;
    properties: RegionFeaturePropertiesSchema;
  }> {}

/** One region as a GeoJSON feature */
export const regionFeatureSchema: RegionFeatureSchema = z.object({
  type: z.literal("Feature"),
  id: z.string(),
  geometry: regionGeometrySchema,
  properties: regionFeaturePropertiesSchema,
});

export interface RegionFeatureCollectionSchema extends
  z.ZodObject<{
    type: z.ZodLiteral<"FeatureCollection">;
    features: z.ZodArray<RegionFeatureSchema>;
  }> {}

/** Regions as a GeoJSON feature collection */
export const regionFeatureCollectionSchema: RegionFeatureCollectionSchema = z
  .object({
    type: z.literal("FeatureCollection"),
    features: z.array(regionFeatureSchema),
  });
