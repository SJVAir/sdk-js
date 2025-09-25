/**
 * A collection of utililties for creating HTTP requests to the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { setOrigin, apiCall } from "@sjvair/sdk/http";
 *
 * setOrigin("http://localhost:8000");
 * const time = await apiCall<number>("time");
 * console.log(time);
 * // Prints:
 * //  1700000000
 * ```
 *
 * @module
 */
export * from "./origin.ts";
export * from "./requests.ts";
export * from "./error.ts";
