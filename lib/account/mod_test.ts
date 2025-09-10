import { assertEquals } from "@std/assert";
import { setOrigin } from "$http";
import { getSimpleValidationTest, loginCredentials } from "$testing";
import { userDetailsSchema } from "./schema.ts";
import { login } from "./login.ts";
import { getUserDetails } from "./details.ts";
import type { UserDetails } from "./types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateUserDetails = getSimpleValidationTest(userDetailsSchema);

Deno.test({
  name: "Module: Account Endpoints",
  permissions: { net: true },
  async fn(t) {
    let loginUser: UserDetails;

    const canLogin = await t.step(
      "POST account/login/",
      async () => {
        const { identifier, password } = loginCredentials;
        loginUser = await login(
          identifier,
          password,
        );

        validateUserDetails(loginUser);
      },
    );

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
  },
});
