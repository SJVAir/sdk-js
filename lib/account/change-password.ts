import { jsonCall } from "$http";
import type { UserDetails } from "./types.ts";

interface ChangePasswordConfig {
  old_password: string;
  new_password1: string;
  new_password2: string;
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
