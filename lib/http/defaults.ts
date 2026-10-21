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

const DEFAULT_CSRF_HEADER = "X-CSRFToken";

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

function applyHeaders(target: Headers, source: HeadersInit | undefined): void {
  if (!source) return;
  new Headers(source).forEach((value, name) => target.set(name, value));
}

/**
 * Builds the final `fetch` init for a request. Precedence, lowest to highest:
 * built-in CSRF header, global defaults, the function's own init, the
 * caller's `options.init`. `options.signal` wins over every `init.signal`.
 *
 * @param _url The request URL
 * @param functionInit The init the SDK function itself supplies
 * @param options The caller's request options
 *
 * @returns The merged init
 */
export function buildRequestInit(
  _url: URL,
  functionInit: RequestInit | undefined,
  options: RequestOptions | undefined,
): RequestInit {
  const headers = new Headers();

  // Task 2: add the CSRF header here.

  const defaultHeaders = typeof defaults.headers === "function"
    ? defaults.headers()
    : defaults.headers;
  applyHeaders(headers, defaultHeaders);
  applyHeaders(headers, functionInit?.headers);
  applyHeaders(headers, options?.init?.headers);

  const signal = options?.signal ?? options?.init?.signal ??
    functionInit?.signal;

  return {
    ...(defaults.credentials ? { credentials: defaults.credentials } : {}),
    ...functionInit,
    ...options?.init,
    headers,
    ...(signal ? { signal } : {}),
  };
}

/**
 * Copies an init with the values of `Authorization` and the CSRF header
 * replaced by `"[redacted]"`, for inclusion in error causes.
 *
 * @param init The init to redact
 *
 * @returns A redacted copy
 */
export function redactInit(init: RequestInit): RequestInit {
  const headers = new Headers(init.headers);
  const csrfName = defaults.csrf === false
    ? DEFAULT_CSRF_HEADER
    : defaults.csrf?.headerName ?? DEFAULT_CSRF_HEADER;

  for (const name of ["authorization", csrfName]) {
    if (headers.has(name)) headers.set(name, "[redacted]");
  }

  return { ...init, headers };
}
