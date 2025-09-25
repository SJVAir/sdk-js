/**
 * A utility function for logging into a user account.
 *
 * @example Usage
 * ```ts
 * import { login } from "@sjvair/sdk/account/login";
 *
 * const user = await login(<PHONE_NUMBER>,<API_TOKEN>);
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
 * Log in with the given user credentials.
 *
 * @returns The raw "/account/login" endpoint response
 */
export async function login(
  identifier: string,
  password: string,
): Promise<UserDetails> {
  return await jsonCall<UserDetails>({
    url: "account/login",
    init: {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, password }),
    },
  });
}
