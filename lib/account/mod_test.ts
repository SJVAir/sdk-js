import { assertEquals, fail } from "@std/assert";
import { setOrigin } from "$http";
import { getSimpleValidationTest } from "$testing";
import { passwordResetCredentialsSchema, userDetailsSchema } from "./schema.ts";
import { createUser, type CreateUserForm } from "./create.ts";
import { login } from "./login.ts";
import { getUserDetails } from "./details.ts";
import { updateUser } from "./update.ts";
import { sendPhoneVerification, verifyPhone } from "./phone.ts";
import { passwordResetRequest, resetPassword } from "./password-reset.ts";
import { changePassword } from "./change-password.ts";
import { deleteUser } from "./delete.ts";
import type { PasswordResetCredentials, UserDetails } from "./types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateUserDetails = getSimpleValidationTest(userDetailsSchema);
const validatePasswordResetCreds = getSimpleValidationTest(
  passwordResetCredentialsSchema,
);

const getRandomPhone = () =>
  Array.from({ length: 4 }, () => Math.floor(Math.random() * (8 - 1 + 1)) + 1)
    .join("");

const getRandomPassword = () => `This is still bad ${getRandomPhone()}`;

const promptCode = (phone: string) =>
  prompt(
    `Please enter the code that was sent to the phone number "${phone}"`,
  )!;

const TEST_USER_FORM: CreateUserForm = {
  full_name: "TEST USER",
  password: "Th!$ !$ @ b4d p@$$w0rd",
  phone: `559283${getRandomPhone()}`,
  email: `${getRandomPhone()}@example.com`,
};

Deno.test({
  name: "Module: Account Endpoints",
  permissions: { net: true },
  async fn(t) {
    let createdUser: UserDetails;
    let loginUser: UserDetails;

    const canCreate = await t.step(
      "POST account/register",
      async () => {
        createdUser = await createUser(TEST_USER_FORM);
        validateUserDetails(createdUser);
      },
    );

    await t.step({
      name: "POST account/phone/",
      ignore: !canCreate,
      fn: async () => {
        await sendPhoneVerification(createdUser.api_token);
      },
    });

    await t.step({
      name: "POST account/phone/verify/",
      ignore: !canCreate,
      fn: async () => {
        const code = promptCode(createdUser.phone);
        await verifyPhone(code, createdUser.api_token);
      },
    });

    const canLogin = await t.step({
      name: "POST account/login/",
      ignore: !canCreate,
      fn: async () => {
        loginUser = await login(
          TEST_USER_FORM.phone,
          TEST_USER_FORM.password,
        );

        validateUserDetails(loginUser);
      },
    });

    await t.step({
      name: "GET  account/",
      ignore: !canLogin,
      async fn() {
        const details = await getUserDetails(loginUser.api_token);

        validateUserDetails(details);
        assertEquals(
          loginUser,
          details,
          "Login user object differs from details user object",
        );
      },
    });

    await t.step({
      name: "PATCH  account/",
      ignore: !canLogin,
      async fn() {
        const newEmail = "thisbethenewemail@example.com";
        const updatedUser = await updateUser({
          api_token: loginUser.api_token,
          email: newEmail,
        });

        validateUserDetails(updatedUser);
        assertEquals(newEmail, updatedUser.email);
      },
    });

    await t.step({
      name: "PUT  account/password",
      ignore: !canLogin,
      async fn() {
        const newPass = getRandomPassword();
        loginUser = await changePassword({
          api_token: loginUser.api_token,
          old_password: TEST_USER_FORM.password,
          new_password1: newPass,
          new_password2: newPass,
        });

        validateUserDetails(loginUser);
      },
    });

    await t.step({
      name: "Reset password",
      ignore: !canLogin,
      async fn(t2) {
        let resetCreds: PasswordResetCredentials;

        const resetRequestSuccess = await t2.step({
          name: "POST  account/password-reset",
          ignore: !canLogin,
          async fn() {
            resetCreds = await passwordResetRequest(loginUser.phone);

            validatePasswordResetCreds(resetCreds);
          },
        });

        await t2.step({
          name: "POST  account/password-reset/{UIDB64}/{TOKEN}",
          ignore: !resetRequestSuccess,
          async fn() {
            const code: string = promptCode(loginUser.phone);

            const newPass = getRandomPassword();
            await resetPassword({
              new_password1: newPass,
              new_password2: newPass,
              code,
              ...resetCreds,
            });
          },
        });
      },
    });

    await t.step({
      name: "DEL  account/",
      ignore: !canLogin,
      async fn() {
        await deleteUser(
          TEST_USER_FORM.password,
          loginUser.api_token,
        );
      },
    });
  },
});
