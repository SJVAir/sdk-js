/**
 * Types for account-related data structures.
 *
 * @module
 */
import type { infer as zinfer } from "zod";
import type {
  airAlertSchema,
  monitorSubscriptionSchema,
  monitorUnsubscribeResponseSchema,
  passwordResetCredentialsSchema,
  userDetailsSchema,
} from "./schema.ts";

/** An Air Alert object returned from the SJVAir API */
export type AirAlert = zinfer<typeof airAlertSchema>;

/** A Monitor Subscription object returned from the SJVAir API */
export type MonitorSubscription = zinfer<typeof monitorSubscriptionSchema>;

/** The response from unsubscribing from a monitor */
export type MonitorUnsubscribeResponse = zinfer<
  typeof monitorUnsubscribeResponseSchema
>;

/** The credentials required to reset a user's password */
export type PasswordResetCredentials = zinfer<
  typeof passwordResetCredentialsSchema
>;

/** The details of a user account */
export type UserDetails = zinfer<typeof userDetailsSchema>;
