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
import type { SessionUserDetails, UserDetails } from "./types.ts";

/** The form used to update a user */
export type UpdateUserForm =
  & Partial<Omit<UserDetails, "api_token" | "phone_verified">>
  & Partial<Pick<UserDetails, "api_token">>;

/**
 * Update a user.
 *
 * @param form The fields to update, plus the user's `api_token`.
 * @param options Request options.
 * @returns The modified user object
 */
export function updateUser(
  form: UpdateUserForm & { api_token: string },
  options?: RequestOptions,
): Promise<UserDetails>;
/**
 * Update the signed-in user from the session cookie. The response has no
 * `api_token`; a signed-out call rejects with the server's 401.
 *
 * @param form The fields to update, with no `api_token`.
 * @param options Request options.
 * @returns The modified user object, without `api_token`
 */
export function updateUser(
  form: UpdateUserForm & { api_token?: undefined },
  options?: RequestOptions,
): Promise<SessionUserDetails>;
/**
 * Update a user with a token that may be absent.
 *
 * @param form The fields to update, plus an optional `api_token`.
 * @param options Request options.
 * @returns The modified user, with `api_token` only when a token was passed
 */
export function updateUser(
  form: UpdateUserForm,
  options?: RequestOptions,
): Promise<UserDetails | SessionUserDetails>;
export async function updateUser(
  form: UpdateUserForm,
  options?: RequestOptions,
): Promise<UserDetails | SessionUserDetails> {
  const { api_token, ...userForm } = form;

  return await jsonCall<UserDetails | SessionUserDetails>({
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
