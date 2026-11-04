/**
 * A utility function for listing CalEnviroScreen tract scores from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getCalEnviroScreen } from "@sjvair/sdk/calenviroscreen/get_calenviroscreen";
 *
 * // The CES 5.0 scores of the tracts inside Fresno County
 * const tracts = await getCalEnviroScreen("5.0", {
 *   region_id: "5nO2A8",
 *   within_mode: "contained",
 * });
 * console.log(tracts[0].tract, tracts[0].ci_score_p);
 * // Prints: 06019000101 92.4
 * ```
 *
 * @module
 */
import { paginatedApiCall, type RequestOptions } from "$http";
import type {
  CESQueryByVersion,
  CESRecordByVersion,
  CESVersion,
} from "./types.ts";

/**
 * Fetches CalEnviroScreen scores for census tracts, every page. The version is
 * required: the SDK doesn't pick one.
 *
 * @param version The CalEnviroScreen version, `"4.0"` or `"5.0"`.
 * @param query Optional filters: a region (and how tracts must sit in it), and
 * for 4.0 the tract boundary year.
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The matching tracts' scores, in that version's shape.
 */
export async function getCalEnviroScreen<V extends CESVersion>(
  version: V,
  query?: CESQueryByVersion[V],
  options?: RequestOptions,
): Promise<Array<CESRecordByVersion[V]>> {
  const searchParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) searchParams[key] = value;
  }
  return await paginatedApiCall<CESRecordByVersion[V]>({
    url: `calenviroscreen/${version}`,
    searchParams,
    options,
  });
}
