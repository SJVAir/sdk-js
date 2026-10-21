/**
 * A utility function for getting the details of a pesticide use record.
 *
 * @example Usage
 * ```ts
 * import { getPesticideUseDetails } from "@sjvair/sdk/pesticides/get_pesticide_use_details";
 *
 * const use = await getPesticideUseDetails("fucm98");
 * console.log(use);
 * // Prints:
 * //  {
 * //    "id": "fucm98",
 * //    "year": 2022,
 * //    "use_no": 3858276,
 * //    ... (excerpted for brevity)
 * //  }
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import type { PesticideUseData } from "./types.ts";

/**
 * Fetch details about a pesticide use record.
 *
 * @param useId The ID of the requested pesticide use record
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns A PesticideUseData object containing pesticide use details
 */
export async function getPesticideUseDetails(
  useId: string,
  options?: RequestOptions,
): Promise<PesticideUseData> {
  return await jsonCall<PesticideUseData>({
    url: `pesticides/use/${useId}`,
    options,
  });
}
