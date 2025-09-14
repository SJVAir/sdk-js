import { jsonCall } from "$http";

export interface PasswordResetConfig {
  code: string;
  uid64: string;
  token: string;
  new_password1: string;
  new_password2: string;
}

/**
 * Register a new user.
 *
 * @returns The raw GET "/account/register" endpoint response
 */
export async function resetPassword(
  config: PasswordResetConfig,
): Promise<unknown> {
  //TODO: get return type
  const { token, uid64, ...form } = config;
  return await jsonCall<unknown>({
    url: `account/password-reset/${uid64}/${token}`,
    init: {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    },
  });
}
