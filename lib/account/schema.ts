import * as z from "zod";

export interface UserDetailsSchema extends
  z.ZodObject<{
    /** The ID of the user */
    id: z.ZodString;
    /** The full name of the user */
    full_name: z.ZodString;
    /** The email of the user */
    email: z.ZodString;
    /** The phone of the user */
    phone: z.ZodString;
    /** Indicates whether or not he user's phone number has been verified */
    phone_verified: z.ZodBoolean;
    /** The user's api token */
    api_token: z.ZodString;
  }> {}

export const userDetailsSchema: UserDetailsSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  email: z.string(),
  phone: z.string(),
  phone_verified: z.boolean(),
  api_token: z.string(),
});

export interface UserDetailsWithLangSchema extends
  z.ZodObject<
    UserDetailsSchema["shape"] & {
      /** The selected language of the user */
      language: z.ZodEnum;
    }
  > {}

export const userDetailsWithLangSchema: UserDetailsWithLangSchema =
  userDetailsSchema.extend({
    language: z.enum(["en", "es", "hmn", "tl"]),
  });
