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
import type { UserDetails } from "./types.ts";

/**
 * Get details of a user from their given api token.
 *
 * @param token Optional. Without it, the call relies on the session
 *   cookie; a missing sign-in surfaces as the server's 401/403.
 * @param options Request options.
 * @returns The raw GET "/account" endpoint response
 */
export async function getUserDetails(
  token?: string,
  options?: RequestOptions,
): Promise<UserDetails> {
  return await jsonCall<UserDetails>({
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
