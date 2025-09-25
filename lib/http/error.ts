/**
 * A collection of utililties for creating HTTP errors from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { APIError } from "@sjvair/sdk/http";
 *
 * const error = new APIError("Request failed", response);
 * console.log(error);
 * // Prints:
 * // Error: Test error
 * //     at file:///home/alex/tmp/deno/main.ts:50:13
 * //     at eventLoopTick (ext:core/01_core.js:179:7)
 * // Caused by <RESPONSE OBJECT> (excluded for brevity)
 * ```
 *
 * @module
 */
import type { APIRequestResponse } from "./requests.ts";

/**
 * The standard format for throwing errors from an SJVAir API request.
 */
export class APIError<T> extends Error {
  /**
   * Creates an instance of APIError<T>.
   * @param message The main message of the error.
   * @param response The response object of the failed request.
   */
  constructor(message: string, response: APIRequestResponse<T>) {
    super(message, { cause: response });
  }
}

/**
 * A generic error handler for fetch requests
 */
export function genericAPIErrorHandler(fault: unknown): void {
  let error: Error;

  if (fault instanceof Error || fault instanceof APIError) {
    error = fault;
    // deno-lint-ignore no-explicit-any
    if ("cause" in error && "result" in (error.cause as any)) {
      // deno-lint-ignore no-explicit-any
      (error.cause as any)["details"] = (error.cause as any).result.body.errors;
    }
  } else {
    error = new Error("Unexpected error in request", { cause: fault });
  }

  throw error;
}
