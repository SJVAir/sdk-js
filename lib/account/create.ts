import { jsonCall } from "$http";
import type { UserDetails } from "./types.ts";

export interface CreateUserForm {
  full_name: string;
  phone: string;
  email?: string;
  password: string;
}

/**
 * Register a new user. This will also send a sms message to
 * the user with a code for phone verification.
 *
 * @returns The raw GET "/account/register" endpoint response
 */
export async function createUser(
  form: CreateUserForm,
): Promise<UserDetails> {
  return await jsonCall<UserDetails>({
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
