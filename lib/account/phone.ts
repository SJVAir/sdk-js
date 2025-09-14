import { apiCall } from "$http";

/**
 * Prompts the server to send a phone verification email.
 */
export async function sendPhoneVerification(
  apiToken: string,
): Promise<void> {
  return await apiCall<void>({
    url: "account/phone",
    init: {
      method: "POST",
      headers: {
        "Authorization": `Token ${apiToken}`,
      },
    },
  });
}

/**
 * Submit an OTP for phone verification.
 *
 * @returns
 */
export async function verifyPhone(
  code: string,
  apiToken: string,
): Promise<void> {
  return await apiCall<void>({
    url: "account/phone/verify",
    init: {
      method: "POST",
      headers: {
        "Authorization": `Token ${apiToken}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    },
  });
}
