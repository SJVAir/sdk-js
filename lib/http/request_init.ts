/**
 * Internal helpers that build and redact the `fetch` init. Not part of the
 * public API: not re-exported from `mod.ts` or listed in `deno.json`.
 *
 * @module
 */

import { getPageOrigin, readCookie } from "./environment.ts";
import { getRequestDefaults, type RequestOptions } from "./defaults.ts";

const DEFAULT_CSRF_HEADER = "X-CSRFToken";
const CSRF_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function applyHeaders(target: Headers, source: HeadersInit | undefined): void {
  if (!source) return;
  new Headers(source).forEach((value, name) => target.set(name, value));
}

/**
 * Builds the final `fetch` init for a request. Precedence, lowest to highest:
 * built-in CSRF header, global defaults, the function's own init, the
 * caller's `options.init`. `options.signal` wins over every `init.signal`.
 *
 * @param url The request URL
 * @param functionInit The init the SDK function itself supplies
 * @param options The caller's request options
 *
 * @returns The merged init
 */
export function buildRequestInit(
  url: URL,
  functionInit: RequestInit | undefined,
  options: RequestOptions | undefined,
): RequestInit {
  const defaults = getRequestDefaults();
  const headers = new Headers();

  const method = (options?.init?.method ?? functionInit?.method ?? "GET")
    .toUpperCase();
  if (defaults.csrf !== false && CSRF_METHODS.has(method)) {
    const pageOrigin = getPageOrigin();
    if (pageOrigin && url.origin === pageOrigin) {
      const token = readCookie(defaults.csrf?.cookieName ?? "csrftoken");
      if (token) {
        headers.set(defaults.csrf?.headerName ?? DEFAULT_CSRF_HEADER, token);
      }
    }
  }

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
 * and the request body replaced by `"[redacted]"`, for inclusion in error causes.
 *
 * @param init The init to redact
 *
 * @returns A redacted copy
 */
export function redactInit(init: RequestInit): RequestInit {
  const defaults = getRequestDefaults();
  const headers = new Headers(init.headers);
  const csrfName = defaults.csrf === false
    ? DEFAULT_CSRF_HEADER
    : defaults.csrf?.headerName ?? DEFAULT_CSRF_HEADER;

  for (const name of ["authorization", csrfName]) {
    if (headers.has(name)) headers.set(name, "[redacted]");
  }

  return {
    ...init,
    headers,
    ...(init.body != null ? { body: "[redacted]" } : {}),
  };
}
