import { assertEquals } from "@std/assert";
import { setOrigin } from "$http";
import {
  EXISTING_MONITOR_ID,
  EXISTING_PHONE,
  getSimpleValidationTest,
} from "$testing";
import {
  monitorSubscriptionSchema,
  monitorUnsubscribeResponseSchema,
  passwordResetCredentialsSchema,
  userDetailsSchema,
} from "./schema.ts";
import { createUser, type CreateUserForm } from "./create.ts";
import { login } from "./login.ts";
import { getUserDetails } from "./details.ts";
import { updateUser } from "./update.ts";
import { sendPhoneVerification, verifyPhone } from "./phone.ts";
import { passwordResetRequest, resetPassword } from "./password-reset.ts";
import { changePassword } from "./change-password.ts";
import { deleteUser } from "./delete.ts";
import { getSubscriptions, subscribe, unsubscribe } from "./subscriptions.ts";
import type {
  MonitorSubscription,
  PasswordResetCredentials,
  UserDetails,
} from "./types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateMonitorSubscription = getSimpleValidationTest(
  monitorSubscriptionSchema,
);
const validateMonitorUnsubscriberesponse = getSimpleValidationTest(
  monitorUnsubscribeResponseSchema,
);
const validateUserDetails = getSimpleValidationTest(userDetailsSchema);
const validatePasswordResetCreds = getSimpleValidationTest(
  passwordResetCredentialsSchema,
);

const delay = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));

const getRandomPhone = () =>
  Array.from({ length: 4 }, () => Math.floor(Math.random() * (8 - 1 + 1)) + 1)
    .join("");

const promptCode = (phone: string) =>
  prompt(
    `Please enter the code that was sent to the phone number "${phone}"`,
  )!;

const TEST_USER_FORM: CreateUserForm = {
  full_name: "TEST USER",
  password: "Th!$ !$ @ b4d p@$$w0rd",
  phone: EXISTING_PHONE,
  email: `${getRandomPhone()}@example.com`,
};

const getRandomPassword = () => {
  TEST_USER_FORM.password = `This is still bad ${getRandomPhone()}`;
  return TEST_USER_FORM.password;
};

Deno.test({
  name: "Module: Account Endpoints",
  permissions: { net: true },
  async fn(t) {
    const crudSuccess = await t.step(
      "Submodule: Account CRUD Operations",
      async (t2) => {
        let createdUser: UserDetails;

        const canCreate = await t2.step(
          "POST  account/register",
          async () => {
            createdUser = await createUser(TEST_USER_FORM);
            validateUserDetails(createdUser);
          },
        );

        await t2.step({
          name: "POST  account/phone/verify/",
          ignore: !canCreate,
          async fn() {
            const code = promptCode(createdUser.phone);
            await verifyPhone(code, createdUser.api_token);
          },
        });

        await t2.step({
          name: "GET   account/",
          ignore: !canCreate,
          async fn() {
            const details = await getUserDetails(createdUser.api_token);

            validateUserDetails(details);
          },
        });

        await t2.step({
          name: "PATCH account/",
          ignore: !canCreate,
          async fn() {
            const newEmail = "thisbethenewemail@example.com";
            const updatedUser = await updateUser({
              api_token: createdUser.api_token,
              email: newEmail,
            });

            validateUserDetails(updatedUser);
            assertEquals(newEmail, updatedUser.email);
          },
        });
        await t2.step({
          name: "DEL   account/",
          ignore: !canCreate,
          async fn() {
            await deleteUser(
              TEST_USER_FORM.password,
              createdUser.api_token,
            );
          },
        });
      },
    );

    await t.step({
      name: "Submodule: Account Management",
      ignore: !crudSuccess,
      fn: async (t2) => {
        const createdUser = await createUser(TEST_USER_FORM);
        await delay(500);
        let loginUser: UserDetails;

        const canLogin = await t2.step({
          name: "POST  account/login/",
          ignore: !createdUser,
          async fn() {
            loginUser = await login(
              TEST_USER_FORM.phone,
              TEST_USER_FORM.password,
            );

            validateUserDetails(loginUser);
          },
        });

        await t2.step({
          name: "Submodule: Phone Verification",
          ignore: !canLogin,
          fn: async (t3) => {
            const canSend = await t3.step({
              name: "POST  account/phone/",
              fn: async () => {
                await sendPhoneVerification(loginUser.api_token);
              },
            });

            await t3.step({
              name: "POST  account/phone/verify/",
              ignore: !canSend,
              fn: async () => {
                const code = promptCode(loginUser.phone);
                await verifyPhone(code, loginUser.api_token);
              },
            });
          },
        });

        await t2.step({
          name: "Submodule: Monitor Subscriptions",
          ignore: !canLogin,
          async fn(t3) {
            let subscriptions: Array<MonitorSubscription>;

            const canSubscribe = await t3.step(
              "Post  monitors/<MONITOR_ID>/alerts/subscribe/",
              async () => {
                const subscription = await subscribe({
                  level: "unhealthy_sensitive",
                  monitorId: EXISTING_MONITOR_ID,
                  apiToken: loginUser.api_token,
                });

                validateMonitorSubscription(subscription);
              },
            );

            await t3.step({
              name: "GET   alerts/subscriptions",
              ignore: !canSubscribe,
              async fn() {
                subscriptions = await getSubscriptions(loginUser.api_token);
                validateMonitorSubscription(subscriptions);
              },
            });

            await t3.step({
              name: "Post  monitors/<MONITOR_ID>/alerts/unsubscribe/",
              ignore: !Array.isArray(subscriptions!) ||
                subscriptions.length <= 0,
              async fn() {
                const result = await unsubscribe({
                  level: "unhealthy_sensitive",
                  monitorId: EXISTING_MONITOR_ID,
                  apiToken: loginUser.api_token,
                });
                validateMonitorUnsubscriberesponse(result);
              },
            });
          },
        });

        await t2.step({
          name: "PUT   account/password",
          ignore: !canLogin,
          async fn() {
            const { password: old_password } = TEST_USER_FORM;
            const newPass = getRandomPassword();
            loginUser = await changePassword({
              api_token: loginUser.api_token,
              old_password,
              new_password1: newPass,
              new_password2: newPass,
            });

            validateUserDetails(loginUser);
          },
        });

        await t2.step({
          name: "Submodule: Password Reset",
          ignore: !canLogin,
          async fn(t3) {
            let resetCreds: PasswordResetCredentials;

            const resetRequestSuccess = await t3.step(
              "POST  account/password-reset",
              async () => {
                resetCreds = await passwordResetRequest(loginUser.phone);

                validatePasswordResetCreds(resetCreds);
              },
            );

            await t3.step({
              name: "POST  account/password-reset/{UIDB64}/{TOKEN}",
              ignore: !resetRequestSuccess,
              async fn() {
                const code: string = promptCode(loginUser.phone);

                const newpass = getRandomPassword();
                await resetPassword({
                  new_password1: newpass,
                  new_password2: newpass,
                  code,
                  ...resetCreds,
                });
              },
            });
          },
        });

        await deleteUser(TEST_USER_FORM.password, loginUser!.api_token);
      },
    });
  },
});
