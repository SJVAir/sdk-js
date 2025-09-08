import { apiRequest, type APIRequestResponse, getApiUrl } from "$http";
import type { UserDetails } from "./types.ts";

/**
 * Get details of a user from their given api token.
 *
 * @returns The raw GET "/account" endpoint response
 */
export async function getUserDetails(
  token: string,
): Promise<APIRequestResponse<{ data: UserDetails }>> {
  return await apiRequest<{ data: UserDetails }>(
    getApiUrl("account"),
    {
      headers: {
        "Accept": "application/json",
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
}
