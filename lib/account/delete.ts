import { apiCall } from "$http";

/**
 * Deletes user.
 *
 * @returns
 */
export async function deleteUser(
  password: string,
  apiToken: string,
): Promise<void> {
  return await apiCall<void>({
    url: "account",
    init: {
      method: "DELETE",
      headers: {
        "Authorization": `Token ${apiToken}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    },
  });
}
