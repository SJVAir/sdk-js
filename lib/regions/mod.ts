/**
 * A collection of utililties for interacting with the SJVAir regions API
 *
 * @example Usage
 * ```ts
 * import { getRegionsList } from "@sjvair/sdk/regions";
 *
 * const regions = await getRegionsList({ type: "county" });
 * console.log(regions);
 * // Prints:
 * //  [
 * //    {
 * //      "id": "5nO2A8",
 * //      "name": "Fresno County",
 * //      "slug": "fresno-county",
 * //      "type": "county",
 * //      "boundary": {
 * //        "id": "PBl0aV",
 * //        "version": "2020",
 * //        "geometry": { "type": "MultiPolygon", "coordinates": [ ... ] },
 * //        "bbox": [-120.919, 35.907, -118.361, 37.586]
 * //      }
 * //    },
 * //    ... (more regions)
 * //  ]
 * ```
 *
 * @module
 */
export * from "./get_region_details.ts";
export * from "./get_region_places.ts";
export * from "./get_region_summaries.ts";
export * from "./get_region_summaries_bulk.ts";
export * from "./get_regions_list.ts";
export * from "./get_regions_meta.ts";
export * from "./types.ts";
