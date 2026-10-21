/**
 * A utility function for deleting user accounts.
 *
 * @example Usage
 * ```ts
 * import { delete } from "@sjvair/sdk/account/delete";
 *
 * const user = await delete({
 *  password: "Password123",
 * });
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
import { apiCall } from "$http";
import type { RequestOptions } from "$http";
import { authHeaders } from "./auth_headers.ts";

/**
 * Deletes user.
 *
 * @param password The user's password.
 * @param apiToken Optional. Without it, the call relies on the session
 *   cookie; a missing sign-in surfaces as the server's 401/403.
 * @param options Request options.
 */
export async function deleteUser(
  password: string,
  apiToken?: string,
  options?: RequestOptions,
): Promise<void> {
  return await apiCall<void>({
    url: "account",
    init: {
      method: "DELETE",
      headers: authHeaders(apiToken, {
        "Accept": "application/json",
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ password }),
    },
    options,
  });
}
