/**
 * A utility function to look regions up by their official codes.
 *
 * @example Usage
 * ```ts
 * import { getRegionsByCode } from "@sjvair/sdk/regions/get_regions_by_code";
 *
 * const [fresno] = await getRegionsByCode("county", ["06019"]);
 * console.log(fresno.name, fresno.retired);
 * // Prints: Fresno County null
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import type { RegionListItem, RegionType } from "./types.ts";

/** The most codes the API resolves in one request */
export const LOOKUP_MAX_CODES = 100;

/**
 * Fetches the regions of one type that have the given official codes (e.g.
 * county FIPS codes). Retired regions are returned too, flagged by `retired`,
 * so a stored code keeps resolving. Unknown codes are left out of the result.
 *
 * @param type The type of the regions. Land-use regions have no codes yet.
 * @param codes The codes to look up, at most 100. An empty list returns `[]`
 * without a request.
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The matching regions, in no particular order.
 */
export async function getRegionsByCode(
  type: RegionType,
  codes: Array<string>,
  options?: RequestOptions,
): Promise<Array<RegionListItem>> {
  if (type === "land_use") {
    throw new Error("Land-use regions can't be looked up by code");
  }
  if (codes.length > LOOKUP_MAX_CODES) {
    throw new Error(
      `getRegionsByCode looks up at most ${LOOKUP_MAX_CODES} codes at once`,
    );
  }
  if (codes.length === 0) return [];

  return await jsonCall<Array<RegionListItem>>({
    url: "regions",
    searchParams: { type, external_id: codes.join(",") },
    options,
  });
}
