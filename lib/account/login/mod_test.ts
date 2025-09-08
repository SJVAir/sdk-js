import { assertEquals } from "@std/assert";
import { origin, setOrigin } from "$http";
import { getSimpleValidationTest } from "../../testing.ts";
import { userDetailsSchema } from "../schema.ts";
import { getLoginUrl, login } from "./mod.ts";
import { loginCredentials } from "../test_constants.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateUserLogin = getSimpleValidationTest(userDetailsSchema);

Deno.test({
  name: "Module: Account Login",
  permissions: { net: true },
  async fn(t) {
    await t.step("Build account login request", async (t2) => {
      const canBuildUrl = await t2.step("Get URL", () => {
        const url = getLoginUrl();

        assertEquals(url.href, `${origin}/api/2.0/account/login/`);
      });

      await t2.step({
        name: "Log user in",
        ignore: !canBuildUrl,
        async fn(t3) {
          const { identifier, password } = loginCredentials;
          const response = await login(identifier, password);

          assertEquals(response.status, 200);

          await t3.step(
            "Validate login response",
            () => validateUserLogin(response.body.data),
          );
        },
      });
    });
  },
});
