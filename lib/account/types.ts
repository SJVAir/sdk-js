import type { infer as zinfer } from "zod";
import type {
  passwordResetCredentialsSchema,
  userDetailsSchema,
} from "./schema.ts";

export type UserDetails = zinfer<typeof userDetailsSchema>;

export type PasswordResetCredentials = zinfer<
  typeof passwordResetCredentialsSchema
>;
