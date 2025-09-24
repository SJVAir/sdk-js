/**
 * A collection of utililties for interacting with the SJVAir /account/register/ API
 *
 * @example Usage
 * ```ts
 * import { create } from "@sjvair/sdk/account/create";
 *
 * const user = await create({
 *  full_name: "John Chapman",
 *  phone: "5552221234",
 *  email: "chapmanj@example.com",
 *  password: "Password123",
 * });
 *
 * console.log(user);
 * // Prints:
 * //  {
 * //    id: "6NKDOOsxRyOUFE4rXMr1nQ",
 * //    full_name: "John Chapman",
 * //    email: "chapmanj@hotmail.com",
 * //    phone: "+15592835428",
 * //    phone_verified: false,
 * //    language: "en",
 * //    api_token: "b50601e303e8eb597fe859202d2210ad96a97231"
 * //  }
 * ```
 *
 * @module
 */
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
