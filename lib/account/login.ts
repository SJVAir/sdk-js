import { jsonCall } from "$http";
import type { UserDetails } from "./types.ts";

/**
 * Log in with the given user credentials.
 *
 * @returns The raw "/account/login" endpoint response
 */
export async function login(
  identifier: string,
  password: string,
): Promise<UserDetails> {
  return await jsonCall<UserDetails>({
    url: "account/login",
    init: {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, password }),
    },
  });
}
