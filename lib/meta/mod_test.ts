import { setOrigin } from "$http";
import { getSimpleValidationTest } from "$testing";
import catalogFixture from "./fixtures/dataset_catalog.json" with {
  type: "json",
};
import monitorsMetaFixture from "../monitors/fixtures/monitors_meta.json" with {
  type: "json",
};
import { assertEquals, assertExists } from "@std/assert";
import { getMonitorsMeta } from "../monitors/get_monitors_meta.ts";
import { sjvairMonitorsMetaSchema } from "../monitors/schemas/mod.ts";
import { getDatasetCatalog } from "./get_dataset_catalog.ts";
import { datasetCatalogSchema } from "./schemas/mod.ts";
import type { SJVAirMonitorsMeta } from "../monitors/types.ts";
import type { DatasetCatalog } from "./types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateCatalog = getSimpleValidationTest(datasetCatalogSchema);
const validateMonitorsMeta = getSimpleValidationTest(sjvairMonitorsMetaSchema);

// The fixtures were captured from the server code that serves these endpoints,
// with default-calibrations.yaml loaded.
// JSON imports widen string literals, so state the shape the schema will check.
const catalogData = catalogFixture.data as unknown as DatasetCatalog;
const monitorsMetaData = monitorsMetaFixture
  .data as unknown as SJVAirMonitorsMeta;

function assertCatalogContents(catalog: DatasetCatalog) {
  const airQuality = catalog.datasets.find((d) => d.id === "air-quality");
  assertExists(airQuality, "No air-quality dataset in the catalog");
  const entry = (id: string) => airQuality.entry_types.find((e) => e.id === id);

  assertEquals(entry("pm25")?.available, true);
  // The server's `pm100` is PM10, and is raw-only; `pm10` is PM1.0.
  assertEquals(entry("pm100")?.resolutions, ["raw"]);
  assertEquals(entry("pm10")?.resolutions, ["raw"]);
  // Only pollutants carry `available`.
  assertEquals(entry("temperature")?.available, undefined);
}

Deno.test({
  name: "Module: Meta Endpoints (captured server responses)",
  async fn(t) {
    await t.step("dataset catalog fixture matches the schema", () => {
      const data = catalogData;
      validateCatalog(data);
      assertCatalogContents(data);
      assertEquals(
        data.summary_rules.complete_after_period_end.includes("year"),
        true,
      );
      // `license` and `meta_url` may be empty strings.
      const pesticides = data.datasets.find((d) => d.id === "pesticide-use");
      assertEquals(pesticides?.license, "");
      assertEquals(pesticides?.meta_url, "");
    });

    await t.step("monitors meta fixture matches the schema", () => {
      const data = monitorsMetaData;
      validateMonitorsMeta(data);
      assertEquals(data.available_pollutants.includes("pm25"), true);
    });

    await t.step("a set `retired` marker is accepted", () => {
      const data = structuredClone(catalogData);
      data.datasets[0].retired = { since: "2026-01-01T00:00:00-08:00" };
      data.datasets[1].entry_types[0].retired = {
        since: "2026-01-01T00:00:00-08:00",
        replaced_by: { type: "county", external_id: "06019" },
      };
      validateCatalog(data);
    });
  },
});

// The local dev server may run a branch without these endpoints. Probe once
// and skip the integration steps with a note instead of failing.
let catalog: DatasetCatalog | undefined;
try {
  catalog = await getDatasetCatalog();
} catch (error) {
  // A 404 page isn't JSON, so the HTTP layer rejects with the raw Response as
  // the cause; a JSON 404 carries the parsed `result`.
  const cause = (error as {
    cause?: { status?: number; result?: { status?: number } };
  }).cause;
  const status = cause?.status ?? cause?.result?.status;
  if (status !== 404) throw error;
  console.warn(
    "Skipping the meta/datasets integration steps: the server has no meta/datasets/ endpoint.",
  );
}

Deno.test({
  name: "Module: Meta Endpoints",
  permissions: { net: true },
  ignore: catalog === undefined,
  async fn(t) {
    await t.step("GET  meta/datasets/", () => {
      validateCatalog(catalog!);
      assertCatalogContents(catalog!);
    });

    await t.step("GET  monitors/meta/ (available_pollutants)", async () => {
      const meta = await getMonitorsMeta();
      assertEquals(meta.available_pollutants.includes("pm25"), true);
    });
  },
});
