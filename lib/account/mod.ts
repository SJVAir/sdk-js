/**
 * A collection of utililties for interacting with the SJVAir /account/ endpoint.
 *
 * @example Usage
 * ```ts
 * import { getSubscriptions, login } from "@sjvair/sdk/account";
 *
 * const user = await login("YourUsername", "YourPassword");
 * const subscriptions = await getSubscriptions(user.api_token);
 *
 * console.log(subscriptions);
 * // Prints:
 * //  [
 * //    { monitor: "qesuIWgTQgqtfGJ0rvBBlw", level: "unhealthy" },
 * //    { monitor: "xgXCRh68SdG5FOdbUXvR6Q", level: "unhealthy_sensitive" }
 * //  ]
 * ```
 *
 * @module
 */

export { getAirAlerts } from "./air-alerts.ts";
export {
  changePassword,
  type ChangePasswordConfig,
} from "./change-password.ts";
export { createUser, type CreateUserForm } from "./create.ts";
export { deleteUser } from "./delete.ts";
export { getUserDetails } from "./details.ts";
export { login } from "./login.ts";
export {
  type PasswordResetConfig,
  passwordResetRequest,
  resetPassword,
} from "./password-reset.ts";
export { sendPhoneVerification, verifyPhone } from "./phone.ts";
export {
  getSubscriptions,
  type MonitorSubscriptionConfig,
  subscribe,
  unsubscribe,
} from "./subscriptions.ts";
export * from "./types.ts";
export { updateUser, type UpdateUserForm } from "./update.ts";
