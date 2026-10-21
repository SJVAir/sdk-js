/**
 * A utility function for updating a user's account.
 *
 * @example Usage
 * ```ts
 * import { updateUser } from "@sjvair/sdk/account/update";
 *
 * const user = await update({
 *  email: "mynewemail@example.com",
 * });
 *
 * console.log(user);
 * // Prints:
 * //  {
 * //    id: "6NKDOOsxRyOUFE4rXMr1nQ",
 * //    full_name: "John Chapman",
 * //    email: "mynewemail@example.com",
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

/** The form used to update a user */
export type UpdateUserForm =
  & Partial<Omit<UserDetails, "api_token" | "phone_verified">>
  & Partial<Pick<UserDetails, "api_token">>;

/**
 * Update a user.
 *
 * @param form The fields to update, plus an optional `api_token`. Without the
 *   token, the call relies on the session cookie; a missing sign-in surfaces
 *   as the server's 401/403.
 * @param options Request options.
 * @returns The modigied user object
 */
export async function updateUser(
  form: UpdateUserForm,
  options?: RequestOptions,
): Promise<UserDetails> {
  const { api_token, ...userForm } = form;

  return await jsonCall<UserDetails>({
    url: "account",
    init: {
      method: "PATCH",
      headers: authHeaders(api_token, {
        "Accept": "application/json",
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(userForm),
    },
    options,
  });
}
