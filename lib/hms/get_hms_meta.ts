/**
 * A utility function for fetching the HMS metadata from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getHmsMeta } from "@sjvair/sdk/hms/get_hms_meta";
 *
 * const { scales } = await getHmsMeta();
 * console.log(Object.keys(scales));
 * // Prints: [ "smoke-density", "fire-frp" ]
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import type { HmsMeta } from "./types.ts";

/**
 * Fetches the scales HMS smoke density and fire radiative power are rated on,
 * keyed by scale id.
 *
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The `scales` by id: `smoke-density` and `fire-frp`.
 */
export async function getHmsMeta(options?: RequestOptions): Promise<HmsMeta> {
  return await jsonCall<HmsMeta>({ url: "hms/meta", options });
}
