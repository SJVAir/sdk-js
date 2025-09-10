import * as z from "zod";

export interface UserDetailsSchema extends
  z.ZodObject<{
    id: z.ZodString;
    full_name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    phone_verified: z.ZodBoolean;
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
