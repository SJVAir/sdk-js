/**
 * A collection of utililties for interacting with the SJVAir /account/password/ endpoint.
 *
 * @example Usage
 * ```ts
 * import { changePassword } from "@sjvair/sdk/account/change-password";
 *
 * const user = await changePassword({
 *  old_password: "OldPassword123",
 *  new_password1: "NewPassword456",
 *  new_password2: "NewPassword456",
 *  api_token: "<API_TOKEN>",
 * });
 *
 * console.log(user);
 * // Prints:
 * //  {
 * //    id: "6NKDOOsxadsfjqwpoef",
 * //    full_name: "John Chapman",
 * //    email: "chapmanj@example.com",
 * //    phone: "+15552221234",
 * //    phone_verified: true,
 * //    language: "en",
 * //    api_token: "lkjhasdflkjhasdfk"
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
 * The form data required to change a user's password.
 */
export interface ChangePasswordConfig {
  /** The current password */
  old_password: string;
  /** The desired new password */
  new_password1: string;
  /** The desired new password */
  new_password2: string;
  /**
   * The user's API token. Optional. Without it, the call relies on the session
   * cookie; a missing sign-in surfaces as the server's 401/403.
   */
  api_token?: string;
}
/**
 * Submit a password change.
 *
 * @param config The password form and the user's API token.
 * @param options Request options.
 * @returns The user details object
 */
export function changePassword(
  config: ChangePasswordConfig & { api_token: string },
  options?: RequestOptions,
): Promise<UserDetails>;
/**
 * Submit a password change for the signed-in user from the session cookie. The
 * response has no `api_token`; a signed-out call rejects with the server's 401.
 *
 * @param config The password form, with no `api_token`.
 * @param options Request options.
 * @returns The user details object, without `api_token`
 */
export function changePassword(
  config: ChangePasswordConfig & { api_token?: undefined },
  options?: RequestOptions,
): Promise<SessionUserDetails>;
/**
 * Submit a password change with a token that may be absent.
 *
 * @param config The password form and optional API token.
 * @param options Request options.
 * @returns The user details, with `api_token` only when a token was passed
 */
export function changePassword(
  config: ChangePasswordConfig,
  options?: RequestOptions,
): Promise<UserDetails | SessionUserDetails>;
export async function changePassword(
  config: ChangePasswordConfig,
  options?: RequestOptions,
): Promise<UserDetails | SessionUserDetails> {
  const { api_token, ...form } = config;
  return await jsonCall<UserDetails | SessionUserDetails>({
    url: "account/password",
    init: {
      method: "PUT",
      headers: authHeaders(api_token, {
        "Accept": "application/json",
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(form),
    },
    options,
  });
}
