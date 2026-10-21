/**
 * A utility function for getting the details of a pesticide commodity.
 *
 * @example Usage
 * ```ts
 * import { getCommodityDetails } from "@sjvair/sdk/pesticides/get_commodity_details";
 *
 * const commodity = await getCommodityDetails("9xvrg");
 * console.log(commodity);
 * // Prints:
 * //  {
 * //    "id": "9xvrg",
 * //    "site_code": "22007",
 * //    "name": "ALMOND",
 * //    "chemicals": [ ... ],
 * //    "products": [ ... ]
 * //  }
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import type { CommodityDetailData } from "./types.ts";

/**
 * Fetch details about a pesticide commodity.
 *
 * @param commodityId The ID of the requested commodity
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns A CommodityDetailData object containing commodity details
 */
export async function getCommodityDetails(
  commodityId: string,
  options?: RequestOptions,
): Promise<CommodityDetailData> {
  return await jsonCall<CommodityDetailData>(
    { url: `pesticides/commodities/${commodityId}`, options },
  );
}
