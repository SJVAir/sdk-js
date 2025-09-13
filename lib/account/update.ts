import { jsonCall } from "$http";
import type { UserDetails } from "./types.ts";

export type UpdateUserForm =
  & Partial<Omit<UserDetails, "api_token">>
  & Pick<UserDetails, "api_token">;

/**
 * Update a user.
 *
 * @returns The modigied user object
 */
export async function updateUser(
  form: UpdateUserForm,
): Promise<UserDetails> {
  const { api_token, ...userForm } = form;

  return await jsonCall<UserDetails>({
    url: "account",
    init: {
      method: "PATCH",
      headers: {
        "Authorization": `Token ${api_token}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userForm),
    },
  });
}
