import { apiRequest, type APIRequestResponse, getApiUrl } from "$http";
import type { UserDetails } from "./types.ts";

/**
 * Log in with the given user credentials.
 *
 * @returns The raw "/account/login" endpoint response
 */
export async function login(
  identifier: string,
  password: string,
): Promise<APIRequestResponse<{ data: UserDetails }>> {
  return await apiRequest<{ data: UserDetails }>(
    getApiUrl("account/login"),
    {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, password }),
    },
  );
}
