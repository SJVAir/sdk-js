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

export function genericAPIErrorHandler(fault: unknown): void {
  let error: Error;

  if (fault instanceof Error || fault instanceof APIError) {
    error = fault;
  } else {
    error = new Error("Unexpected error in request", { cause: fault });
  }

  throw error;
}
