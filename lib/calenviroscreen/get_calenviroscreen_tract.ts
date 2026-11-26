/**
 * A utility function for fetching one census tract's CalEnviroScreen scores from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getCalEnviroScreenTract } from "@sjvair/sdk/calenviroscreen/get_calenviroscreen_tract";
 *
 * const tract = await getCalEnviroScreenTract("4.0", "06019000101", {
 *   year: "2010",
 * });
 * console.log(tract.ci_score_p);
 * // Prints: 92.4
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import type {
  CESRecordByVersion,
  CESTractQueryByVersion,
  CESVersion,
} from "./types.ts";

/**
 * Fetches one census tract's CalEnviroScreen scores.
 *
 * @param version The CalEnviroScreen version, `"4.0"` or `"5.0"`.
 * @param tract The tract's census code (the tract region's `external_id`).
 * @param query Optional: for 4.0, which tract boundaries (`year`).
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The tract's scores, in that version's shape.
 */
export async function getCalEnviroScreenTract<V extends CESVersion>(
  version: V,
  tract: string,
  query?: CESTractQueryByVersion[V],
  options?: RequestOptions,
): Promise<CESRecordByVersion[V]> {
  const searchParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) searchParams[key] = value;
  }
  return await jsonCall<CESRecordByVersion[V]>({
    url: `calenviroscreen/${version}/${tract}`,
    searchParams,
    options,
  });
}
