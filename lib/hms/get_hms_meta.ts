/**
 * A utility function for fetching the HMS metadata from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getHMSMeta } from "@sjvair/sdk/hms/get_hms_meta";
 *
 * const { scales } = await getHMSMeta();
 * console.log(Object.keys(scales));
 * // Prints: [ "smoke-density", "fire-frp" ]
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import type { HMSMeta } from "./types.ts";

/**
 * Fetches the scales HMS smoke density and fire radiative power are rated on,
 * keyed by scale id.
 *
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The `scales` by id: `smoke-density` and `fire-frp`.
 */
export async function getHMSMeta(options?: RequestOptions): Promise<HMSMeta> {
  return await jsonCall<HMSMeta>({ url: "hms/meta", options });
}
