/**
 * A collection of utililties for interacting with the SJVAir /account/password-reset/ endpoint.
 *
 * Resetting a user's password is a two step process. First, you must call
 * the `passwordResetRequest` function with the user's phone number.
 * This will send a SMS message to the user with a code and return the
 * credentials needed to complete the password reset.
 * Next, you must call the `resetPassword` function with the credentials
 * returned from the first step along with the new password.
 *
 * @example Usage
 * ```ts
 * import { passwordResetRequest, resetPassword } from "@sjvair/sdk/account/password-reset";
 *
 * // This call requests a password reset and sends a SMS message to the user.
 * const { uidb64, token } = await passwordResetRequest(<PHONE_NUMBER>});
 *
 * // You'll want to get the code from the user somehow, this is just an example.
 * const code = prompt("Enter the code sent to your phone:");
 *
 * // This call completes the password reset.
 * await resetPassword({
 *   code,
 *   uidb64,
 *   token,
 *   new_password1: "NewPassword123",
 *   new_password2: "NewPassword123",
 * });
 *
 *  // Now you can log in with the new password.
 * ```
 *
 * @module
 */
import { apiCall, jsonCall } from "$http";
import type { PasswordResetCredentials } from "./types.ts";

/**
 * Request a password reset.
 *
 * @returns The credentials needed creating the password reset URL
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
 * The form data required to reset a user's password.
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
 * Sumbit password reset.
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
