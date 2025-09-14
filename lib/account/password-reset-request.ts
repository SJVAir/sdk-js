import { jsonCall } from "$http";
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
