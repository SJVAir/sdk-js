import { jsonCall } from "$http";
import type { UserDetailsWithLang } from "./types.ts";

export interface CreateUserForm {
  full_name: string;
  phone: string;
  email?: string;
  password: string;
}

/**
 * Register a new user.
 *
 * @returns The raw GET "/account/register" endpoint response
 */
export async function createUser(
  form: CreateUserForm,
): Promise<UserDetailsWithLang> {
  return await jsonCall<UserDetailsWithLang>({
    url: "account/register",
    init: {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    },
  });
}
