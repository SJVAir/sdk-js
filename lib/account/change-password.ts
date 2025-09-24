/**
 * A collection of utililties for interacting with the SJVAir /account/password/ API
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
import type { UserDetails } from "./types.ts";

export interface ChangePasswordConfig {
  /** The current password */
  old_password: string;
  /** The desired new password */
  new_password1: string;
  /** The desired new password */
  new_password2: string;
  /** The user's API token */
  api_token: string;
}
/**
 * Submit a password change.
 *
 * @returns The user details object
 */
export async function changePassword(
  config: ChangePasswordConfig,
): Promise<UserDetails> {
  const { api_token, ...form } = config;
  return await jsonCall<UserDetails>({
    url: "account/password",
    init: {
      method: "PUT",
      headers: {
        "Accept": "application/json",
        "Authorization": `Token ${api_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    },
  });
}
