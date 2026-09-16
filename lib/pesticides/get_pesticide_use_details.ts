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
import { jsonCall } from "$http";
import type { PesticideUseData } from "./types.ts";

/**
 * Fetch details about a pesticide use record.
 *
 * @param useId The ID of the requested pesticide use record
 *
 * @returns A PesticideUseData object containing pesticide use details
 */
export async function getPesticideUseDetails(
  useId: string,
): Promise<PesticideUseData> {
  return await jsonCall<PesticideUseData>(`pesticides/use/${useId}`);
}
