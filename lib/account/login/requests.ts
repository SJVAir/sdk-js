import { apiRequest, type APIRequestResponse } from "$http";
import { getLoginUrl } from "./request_builders.ts";
import type { UserDetails } from "../types.ts";

/**
 * Log in with the given user credentials.
 *
 * @returns The raw "/account/login" endpoint response
 */
export async function login(
  identifier: string,
  password: string,
): Promise<APIRequestResponse<{ data: UserDetails }>> {
  const requestUrl = getLoginUrl();

  return await apiRequest<{ data: UserDetails }>(requestUrl, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identifier, password }),
  });
}
