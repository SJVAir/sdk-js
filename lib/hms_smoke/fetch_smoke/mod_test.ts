import { assertEquals, fail } from "@std/assert";
import { origin, setOrigin } from "$http";
import { fetchHMSSmoke, getHMSSmoke, getHMSSmokeUrl } from "./mod.ts";
import { hmsSmokeSchema } from "../schema.ts";
import { getSimpleValidationTest } from "../../testing.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateHMSSmokeData = getSimpleValidationTest(hmsSmokeSchema);

Deno.test({
  name: "Module: Fetch HMS Smoke",
  permissions: { net: true },
  async fn(t) {
    const success = await t.step(
      "Build fetch HMS Smoke request",
      async (t2) => {
        const canBuildUrl = await t2.step("Get URL", () => {
          const url = getHMSSmokeUrl();

          assertEquals(url.href, `${origin}/api/2.0/hms-smoke/?page=1`);
        });

        await t2.step({
          name: "Fetch raw response",
          ignore: !canBuildUrl,
          async fn(t3) {
            const rawResponse = await fetchHMSSmoke();

            assertEquals(rawResponse.status, 200);

            await t3.step(
              "Handle raw response",
              async (t4) => {
                const smoke = rawResponse.body.data;

                assertEquals(Array.isArray(smoke), true);

                await t4.step(
                  "Validate HMS Smoke data",
                  () => validateHMSSmokeData(smoke),
                );
              },
            );
          },
        });
      },
    );

    await t.step({
      name: "Prebuilt HMS Smoke request",
      ignore: !success,
      async fn(t2) {
        await t2.step(
          "Fetch HMS Smoke",
          async (t3) => {
            const smoke = await getHMSSmoke()
              .catch((err) => {
                console.error("Error(fetch all monitors):", err);
                fail(
                  "Prebuilt fetchMonitors request failed! Error data should be displayed",
                );
              });
            assertEquals(Array.isArray(smoke), true);

            await t3.step(
              "Validate HMS Smoke data",
              () => validateHMSSmokeData(smoke),
            );
          },
        );
      },
    });
  },
});
