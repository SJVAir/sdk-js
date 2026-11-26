/**
 * A utility function for getting a full user profile.
 *
 * @example Usage
 * ```ts
 * import { getUserDetails } from "@sjvair/sdk/account/details";
 *
 * const user = await getUserDetails(<API_TOKEN>);
 *
 * console.log(user);
 * // Prints:
 * //  {
 * //    id: "6NKDOOsxRyOUFE4rXMr1nQ",
 * //    full_name: "John Chapman",
 * //    email: "chapmanj@example.com",
 * //    phone: "+15552221234",
 * //    phone_verified: false,
 * //    language: "en",
 * //    api_token: "b50601e303e8eb597f"
 * //  }
 * ```
 *
 * @module
 */
import { jsonCall } from "$http";
import type { RequestOptions } from "$http";
import { authHeaders } from "./auth_headers.ts";
import type { SessionUserDetails, UserDetails } from "./types.ts";

/**
 * Get details of a user from their given api token.
 *
 * @param token The user's api token.
 * @param options Request options.
 * @returns The raw GET "/account" endpoint response
 */
export function getUserDetails(
  token: string,
  options?: RequestOptions,
): Promise<UserDetails>;
/**
 * Get details of the signed-in user from the session cookie. The response has
 * no `api_token`; a signed-out call rejects with the server's 401.
 *
 * @param token Omitted, so the call relies on the session cookie.
 * @param options Request options.
 * @returns The GET "/account" endpoint response, without `api_token`
 */
export function getUserDetails(
  token?: undefined,
  options?: RequestOptions,
): Promise<SessionUserDetails>;
/**
 * Get details of a user with a token that may be absent.
 *
 * @param token The user's api token, or none to use the session cookie.
 * @param options Request options.
 * @returns The response, with `api_token` only when a token was passed
 */
export function getUserDetails(
  token?: string,
  options?: RequestOptions,
): Promise<UserDetails | SessionUserDetails>;
export async function getUserDetails(
  token?: string,
  options?: RequestOptions,
): Promise<UserDetails | SessionUserDetails> {
  return await jsonCall<UserDetails | SessionUserDetails>({
    url: "account",
    init: {
      headers: authHeaders(token, {
        "Accept": "application/json",
        "Content-Type": "application/json",
      }),
    },
    options,
  });
}
