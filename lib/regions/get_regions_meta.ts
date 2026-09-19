/**
 * A utility function for fetching the metadata for the /regions/ API endpoints.
 *
 * @example Usage
 * ```ts
 * import { getRegionsMeta } from "@sjvair/sdk/regions/get_regions_meta";
 *
 * const meta = await getRegionsMeta();
 * console.log(meta);
 * // Prints:
 * //  {
 * //    "types": {
 * //      "county": {
 * //        "type": "county",
 * //        "label": "County",
 * //        "category": "administrative",
 * //      },
 * //      ... (other region types omitted for brevity)
 * //    },
 * //  }
 * ```
 *
 * @module
 */
import { jsonCall } from "$http";
import type { RegionsMetaData, RegionType, RegionTypeMeta } from "./types.ts";

export class RegionsMeta implements RegionsMetaData {
  /**
   * An iterable representation of the region type metadata.
   */
  asIter: {
    /**
     * An array of region type metadata.
     */
    types: Array<RegionTypeMeta>;
  };

  /**
   * Creates an instance of RegionsMeta.
   */
  constructor(private meta: RegionsMetaData) {
    this.asIter = {
      types: Object.values(this.meta.types),
    };
  }

  /**
   * Returns a record of all region type metadata.
   *
   * @returns A record of all region type metadata.
   */
  get types(): Record<string, RegionTypeMeta> {
    return this.meta.types;
  }

  /**
   * Returns the metadata for a specific region type.
   *
   * @param regionType - The type of region to get the metadata for.
   * @returns The metadata for the specified region type.
   */
  type(regionType: RegionType): RegionTypeMeta | undefined {
    return this.asIter.types.find((typeMeta) => typeMeta.type === regionType);
  }
}

/**
 * Fetches the metadata for regions and region types.
 *
 * @returns The metadata for regions and region types.
 */
export async function getRegionsMeta(): Promise<RegionsMeta> {
  return new RegionsMeta(await jsonCall<RegionsMetaData>("regions/meta"));
}
