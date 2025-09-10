import { apiCall } from "$http";
import type { UserDetails } from "./types.ts";

/**
 * The data structure returned from the "/account/login/" endpoint
 */
export type LoginResponse = { data: UserDetails };

/**
 * Log in with the given user credentials.
 *
 * @returns The raw "/account/login" endpoint response
 */
export async function login(
  identifier: string,
  password: string,
): Promise<UserDetails> {
  return await apiCall<LoginResponse, UserDetails>(
    {
      url: "account/login",
      init: {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      },
    },
    (status, body) => {
      if (status !== 200) {
        console.error("Unexpected status code:", status);
      }
      return body.data;
    },
  );
}
