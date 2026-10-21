import * as z from "zod";
import { type MultiPolygonSchema, multiPolygonSchema } from "../../schema.ts";

export interface BoundarySchema extends
  z.ZodObject<{
    /** The ID of this boundary version */
    id: z.ZodString;

    /** The version of this boundary (e.g. "2020", "2023-2024") */
    version: z.ZodString;

    /** The boundary's geometry, as GeoJSON */
    geometry: MultiPolygonSchema;

    /**
     * The bounding box of the boundary's geometry, as
     * `[minLongitude, minLatitude, maxLongitude, maxLatitude]`
     */
    bbox: z.ZodTuple<
      [z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber]
    >;
  }> {}

export const boundarySchema: BoundarySchema = z.object({
  id: z.string(),
  version: z.string(),
  geometry: multiPolygonSchema,
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
});

export interface BoundaryListSchema extends
  z.ZodObject<{
    /** The ID of this boundary version */
    id: z.ZodString;

    /** The version of this boundary (e.g. "2020", "2023-2024") */
    version: z.ZodString;

    /**
     * The bounding box of the boundary's geometry, as
     * `[minLongitude, minLatitude, maxLongitude, maxLatitude]`
     */
    bbox: z.ZodTuple<
      [z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber]
    >;
  }> {}

/**
 * A boundary as returned by the regions list: the same as a full boundary,
 * without `geometry` (fetch a region's details for its full geometry).
 */
export const boundaryListSchema: BoundaryListSchema = boundarySchema.omit({
  geometry: true,
});
