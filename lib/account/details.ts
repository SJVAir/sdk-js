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
import type { UserDetails } from "./types.ts";

/**
 * Get details of a user from their given api token.
 *
 * @returns The raw GET "/account" endpoint response
 */
export async function getUserDetails(
  token: string,
): Promise<UserDetails> {
  return await jsonCall<UserDetails>({
    url: "account",
    init: {
      headers: {
        "Accept": "application/json",
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
    },
  });
}
