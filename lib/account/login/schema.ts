import * as z from "zod";

export interface UserLoginSchema extends
  z.ZodObject<{
    id: z.ZodString;
    full_name: z.ZodString;
    email: z.ZodEmail;
    phone: z.ZodString;
    phone_verified: z.ZodBoolean;
    api_token: z.ZodString;
  }> {}

export const userLoginSchema: UserLoginSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  email: z.email(),
  phone: z.string(),
  phone_verified: z.boolean(),
  api_token: z.string(),
});
