import { apiCall, jsonCall } from "$http";
import type { PasswordResetCredentials } from "./types.ts";

/**
 * Register a new user.
 *
 * @returns The raw GET "/account/register" endpoint response
 */
export async function passwordResetRequest(
  phone: string,
): Promise<PasswordResetCredentials> {
  return await jsonCall<PasswordResetCredentials>({
    url: "account/password-reset",
    init: {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    },
  });
}

/**
 * The password reset request configuration.
 */
export interface PasswordResetConfig {
  /** The code send via SMS */
  code: string;
  /** The base 64 encoded user id recieved by the password reset request */
  uidb64: string;
  /** The token string recieved by the password reset request */
  token: string;
  /** The desired new password */
  new_password1: string;
  /** The desired new password */
  new_password2: string;
}

/**
 * Register a new user.
 *
 * @returns The raw GET "/account/register" endpoint response
 */
export async function resetPassword(
  config: PasswordResetConfig,
): Promise<void> {
  //TODO: get return type
  const { token, uidb64, ...form } = config;
  return await apiCall<void>({
    url: `account/password-reset/${uidb64}/${token}`,
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
