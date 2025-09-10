import type { infer as zinfer } from "zod";
import type { geoJSONPointSchema } from "./schema.ts";

/** The Geolocation of a monitor */
export type GeoJSONPoint = zinfer<typeof geoJSONPointSchema>;
