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
  }> {}

export const boundarySchema: BoundarySchema = z.object({
  id: z.string(),
  version: z.string(),
  geometry: multiPolygonSchema,
});
