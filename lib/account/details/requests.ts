import { apiRequest, type APIRequestResponse } from "$http";
import { getUserDetailsUrl } from "./request_builders.ts";
import type { UserDetails } from "../types.ts";

/**
 * Get details of a user from their given api token.
 *
 * @returns The raw GET "/account" endpoint response
 */
export async function getUserDetails(
  token: string,
): Promise<APIRequestResponse<{ data: UserDetails }>> {
  const requestUrl = getUserDetailsUrl();

  return await apiRequest<{ data: UserDetails }>(requestUrl, {
    headers: {
      "Accept": "application/json",
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json",
    },
  });
}
