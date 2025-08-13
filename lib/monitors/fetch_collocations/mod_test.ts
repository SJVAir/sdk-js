import { assertEquals, fail } from "@std/assert";
import { origin, setOrigin } from "$http";

import {
  fetchCollocations,
  fetchCollocationsHandler,
  getCollocations,
  getCollocationsUrl,
} from "./mod.ts";
import { getSimpleValidation } from "../../schema.ts";
import { collocationSchema } from "../schemas/monitor_data.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateCollocation = getSimpleValidation(
  collocationSchema,
  (error, collocation) => {
    console.error(error);
    console.error(collocation);
    fail("Collocation data did not pass schema validation");
  },
);

Deno.test({
  name: "Module: Fetch Collocations",
  permissions: { net: true },
  async fn(t) {
    const success = await t.step(
      "Build fetch collocations request",
      async (t2) => {
        const canBuildUrl = await t2.step("Get URL", () => {
          const url = getCollocationsUrl();

          assertEquals(url.href, `${origin}/api/2.0/calibrations/`);
        });

        await t2.step({
          name: "Fetch raw response",
          ignore: !canBuildUrl,
          async fn(t3) {
            const rawResponse = await fetchCollocations();

            assertEquals(rawResponse.status, 200);

            await t3.step(
              "Handle raw response",
              async (t4) => {
                const collocations = fetchCollocationsHandler(rawResponse);

                assertEquals(Array.isArray(collocations), true);

                await t4.step(
                  "Validate monitor data",
                  () => validateCollocation(collocations),
                );
              },
            );
          },
        });
      },
    );

    await t.step({
      name: "Prebuilt fetch collocations request",
      ignore: !success,
      async fn(t2) {
        await t2.step(
          "Fetch all monitors",
          async (t3) => {
            const collocations = await getCollocations()
              .catch((err) => {
                console.error("Error(fetch all monitors):", err);
                fail(
                  "Prebuilt fetchMonitors request failed! Error data should be displayed",
                );
              });
            assertEquals(Array.isArray(collocations), true);

            await t3.step(
              "Validate monitor data",
              () => validateCollocation(collocations),
            );
          },
        );
      },
    });
  },
});
