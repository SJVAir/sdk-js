import * as z from "zod";

interface MonitorSubscriptionSchema extends
  z.ZodObject<{
    monitor: z.ZodString;
    level: z.ZodEnum<{
      unhealthy_sensitive: "unhealthy_sensitive";
      unhealthy: "unhealthy";
      very_unhealthy: "very_unhealthy";
      hazardous: "hazardous";
    }>;
  }> {}

export const monitorSubscriptionSchema: MonitorSubscriptionSchema = z.object({
  monitor: z.string(),
  level: z.enum([
    "unhealthy_sensitive",
    "unhealthy",
    "very_unhealthy",
    "hazardous",
  ]),
});

interface MonitorUnsubscribeResponseSchema extends
  z.ZodObject<{
    success: z.ZodBoolean;
  }> {}

export const monitorUnsubscribeResponseSchema:
  MonitorUnsubscribeResponseSchema = z.object({
    success: z.boolean(),
  });

interface PasswordResetCredentialsSchema extends
  z.ZodObject<{
    /** The ID of the user */
    uidb64: z.ZodString;
    /** The full name of the user */
    token: z.ZodString;
  }> {}

export const passwordResetCredentialsSchema: PasswordResetCredentialsSchema = z
  .object({
    uidb64: z.string(),
    token: z.string(),
  });

interface UserDetailsSchema extends
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
    /** The preferred language of the user */
    language: z.ZodEnum;
    /** The user's api token */
    api_token: z.ZodString;
  }> {}

export const userDetailsSchema: UserDetailsSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  email: z.string(),
  phone: z.string(),
  phone_verified: z.boolean(),
  language: z.enum(["en", "es", "hmn", "tl"]),
  api_token: z.string(),
});
