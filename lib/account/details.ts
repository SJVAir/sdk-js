import { apiCall } from "$http";
import type { UserDetails } from "./types.ts";

/**
 * The data structure returned from the "GET /account/" endpoint
 */
export type DetailsResponse = { data: UserDetails };

/**
 * Get details of a user from their given api token.
 *
 * @returns The raw GET "/account" endpoint response
 */
export async function getUserDetails(
  token: string,
): Promise<UserDetails> {
  return await apiCall<{ data: UserDetails }, UserDetails>(
    {
      url: "account",
      init: {
        headers: {
          "Accept": "application/json",
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
        },
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
