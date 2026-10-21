/**
 * Shared header builder for account calls.
 *
 * @module
 */

/**
 * Builds request headers, adding `Authorization: Token <apiToken>` only for a
 * non-empty token. Without a token the call relies on the session cookie.
 *
 * @param apiToken Optional API token.
 * @param headers The function's own (non-auth) headers.
 * @returns The combined headers.
 */
export function authHeaders(
  apiToken?: string,
  headers?: HeadersInit,
): Headers {
  const result = new Headers(headers);
  if (typeof apiToken === "string" && apiToken.length > 0) {
    result.set("Authorization", `Token ${apiToken}`);
  }
  return result;
}
