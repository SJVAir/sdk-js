/**
 * A utility function for fetching the labels of the pesticide filters from the
 * SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getPesticidesMeta } from "@sjvair/sdk/pesticides/get_pesticides_meta";
 *
 * const meta = await getPesticidesMeta();
 * console.log(meta.methods.map((method) => method.label));
 * // Prints: [ "Ground", "Air", "Field fumigation", "Other", "Not reported" ]
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import type { PesticidesMeta } from "./types.ts";

/**
 * Fetches the labels and descriptions for the pesticide filters: chemical
 * categories (with `in_use`, false for the ones no import assigns), IARC
 * groups, use-record application methods (not spray-notice methods), the
 * narrowings, CDPR's placeholder chemicals, the explainer `notes` (keyed by
 * note key), the classification `badges` in display order, `links` (the
 * SprayDays sign-up), the `notice_filters` the notice endpoints accept, the
 * `years` with use data (newest first), the maps' color `ramp` and the
 * layers' `scales` (`spray-notice`). Keys are
 * permanent; labels may change. This is the catalog `meta_url` for `pesticide-use` and
 * `pesticide-notices`.
 *
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The lists, notes, badges, links, years, ramp and scales.
 */
export async function getPesticidesMeta(
  options?: RequestOptions,
): Promise<PesticidesMeta> {
  return await jsonCall<PesticidesMeta>({ url: "pesticides/meta", options });
}
