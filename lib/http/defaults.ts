/**
 * Global request defaults and per-call request options for SJVAir API calls.
 *
 * @example Usage
 * ```ts
 * import { setRequestDefaults } from "@sjvair/sdk/http";
 *
 * setRequestDefaults({
 *   headers: () => ({ Authorization: "Token abc123" }),
 *   credentials: "include",
 * });
 * ```
 *
 * @module
 */

/**
 * Options a caller may pass to any SDK request function.
 */
export interface RequestOptions {
  /** Aborts the request. Wins over `init.signal` when both are given. */
  signal?: AbortSignal;

  /** Extra `fetch` init fields, applied over the defaults and the function's own init. */
  init?: RequestInit;
}

/**
 * Configuration for the CSRF header added to same-origin browser writes.
 */
export interface CSRFOptions {
  /** The cookie to read the token from. Defaults to `csrftoken`. */
  cookieName?: string;

  /** The header to send the token in. Defaults to `X-CSRFToken`. */
  headerName?: string;
}

/**
 * Defaults applied to every request made through the SDK.
 */
export interface RequestDefaults {
  /** Headers added to every request; a function is called on every request. */
  headers?: HeadersInit | (() => HeadersInit);

  /** The `credentials` mode for every request. Unset leaves fetch's default. */
  credentials?: RequestCredentials;

  /** CSRF header configuration, or `false` to disable it. */
  csrf?: false | CSRFOptions;
}

let defaults: RequestDefaults = {};

/**
 * Replaces the global request defaults (no deep merge with earlier values).
 *
 * @param newDefaults The new defaults
 */
export function setRequestDefaults(newDefaults: RequestDefaults): void {
  defaults = newDefaults;
}

/**
 * Gets the current global request defaults.
 *
 * @returns The current defaults
 */
export function getRequestDefaults(): RequestDefaults {
  return defaults;
}

/**
 * Clears the global request defaults.
 */
export function resetRequestDefaults(): void {
  defaults = {};
}
