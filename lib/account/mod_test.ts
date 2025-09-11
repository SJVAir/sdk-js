import { assertEquals } from "@std/assert";
import { setOrigin } from "$http";
import { getSimpleValidationTest } from "$testing";
import { userDetailsSchema, userDetailsWithLangSchema } from "./schema.ts";
import { createUser } from "./create.ts";
import { login } from "./login.ts";
import { getUserDetails } from "./details.ts";
import type { UserDetails, UserDetailsWithLang } from "./types.ts";
import type { CreateUserForm } from "./create.ts";
import { deleteUser } from "./delete.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateUserDetails = getSimpleValidationTest(userDetailsSchema);
const validateUserDetailsWithLang = getSimpleValidationTest(
  userDetailsWithLangSchema,
);

const getRandomPhone = () =>
  Array.from({ length: 4 }, () => Math.floor(Math.random() * (8 - 1 + 1)) + 1)
    .join("");

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
    let createdUser: UserDetailsWithLang;
    let loginUser: UserDetails;

    const canCreate = await t.step(
      "POST account/register",
      async () => {
        createdUser = await createUser(TEST_USER_FORM);
        validateUserDetailsWithLang(createdUser);
      },
    );

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
