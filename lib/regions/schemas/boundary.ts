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
