import type { infer as zinfer } from "zod";
import type {
  airAlertSchema,
  monitorSubscriptionSchema,
  monitorUnsubscribeResponseSchema,
  passwordResetCredentialsSchema,
  userDetailsSchema,
} from "./schema.ts";

export type AirAlert = zinfer<typeof airAlertSchema>;

export type MonitorSubscription = zinfer<typeof monitorSubscriptionSchema>;
export type MonitorUnsubscribeResponse = zinfer<
  typeof monitorUnsubscribeResponseSchema
>;

export type PasswordResetCredentials = zinfer<
  typeof passwordResetCredentialsSchema
>;

export type UserDetails = zinfer<typeof userDetailsSchema>;
