/**
 * A collection of utililties for interacting with the SJVAir /account/phone/ endpoints.
 *
 * Verifying a user's phone is a two step process. First, you must call
 * the `sendPhoneVerification` function with the user's api token.
 * This will send a SMS message to the user with a code.
 * Next, you must call the `verifyPhone` function with the code
 * sent to the user.
 *
 * @example Usage
 * ```ts
 * import { sendPhoneVerification, verifyPhone } from "@sjvair/sdk/account/phone";
 *
 * // This call requests a phone verification and sends a SMS message to the user.
 * await sendPhoneVerification(<API_TOKEN>);
 *
 * // You'll want to get the code from the user somehow, this is just an example.
 * const code = prompt("Enter the code sent to your phone:");
 *
 * // This call completes the phone verification.
 * await verifyPhone(code, <API_TOKEN>);
 *
 * // Now the user's phone is verified.
 * ```
 *
 * @module
 */
import { apiCall } from "$http";
import type { RequestOptions } from "$http";
import { authHeaders } from "./auth_headers.ts";

/**
 * Prompts the server to send a phone verification email.
 *
 * @param apiToken Optional. Without it, the call relies on the session
 *   cookie; a missing sign-in surfaces as the server's 401/403.
 * @param options Request options.
 */
export async function sendPhoneVerification(
  apiToken?: string,
  options?: RequestOptions,
): Promise<void> {
  return await apiCall<void>({
    url: "account/phone",
    init: {
      method: "POST",
      headers: authHeaders(apiToken),
    },
    options,
  });
}

/**
 * Submit an OTP for phone verification.
 *
 * @param code The code sent by SMS.
 * @param apiToken Optional. Without it, the call relies on the session
 *   cookie; a missing sign-in surfaces as the server's 401/403.
 * @param options Request options.
 */
export async function verifyPhone(
  code: string,
  apiToken?: string,
  options?: RequestOptions,
): Promise<void> {
  return await apiCall<void>({
    url: "account/phone/verify",
    init: {
      method: "POST",
      headers: authHeaders(apiToken, {
        "Accept": "application/json",
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ code }),
    },
    options,
  });
}
