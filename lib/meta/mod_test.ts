import { setOrigin } from "$http";
import { getSimpleValidationTest, isUnavailable } from "$testing";
import catalogFixture from "./fixtures/dataset_catalog.json" with {
  type: "json",
};
import monitorsMetaFixture from "../monitors/fixtures/monitors_meta.json" with {
  type: "json",
};
import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import coverageDatasetFixture from "./fixtures/coverage_dataset.json" with {
  type: "json",
};
import coverageEmptyFixture from "./fixtures/coverage_empty.json" with {
  type: "json",
};
import coverageMonitorFixture from "./fixtures/coverage_monitor.json" with {
  type: "json",
};
import coverageRegionFixture from "./fixtures/coverage_region.json" with {
  type: "json",
};
import { getCoverage } from "./get_coverage.ts";
import { getMonitorsMeta } from "../monitors/get_monitors_meta.ts";
import { sjvairMonitorsMetaSchema } from "../monitors/schemas/mod.ts";
import { getDatasetCatalog } from "./get_dataset_catalog.ts";
import {
  coverageSchema,
  datasetCatalogSchema,
  datasetEntryTypeSchema,
} from "./schemas/mod.ts";
import type { SJVAirMonitorsMeta } from "../monitors/types.ts";
import type { Coverage, DatasetCatalog } from "./types.ts";
import { scaleSchema } from "./schemas/mod.ts";
import { calHeatScoreMetaSchema } from "../calheatscore/schemas/calheatscore_meta.ts";
import { hmsMetaSchema } from "../hms/schemas/hms_meta.ts";
import { forecastsMetaSchema } from "../forecasts/schemas/forecasts_meta.ts";
import calHeatScoreMetaFixture from "../calheatscore/fixtures/calheatscore_meta.json" with {
  type: "json",
};
import hmsMetaFixture from "../hms/fixtures/hms_meta.json" with {
  type: "json",
};
import forecastsMetaFixture from "../forecasts/fixtures/forecasts_meta.json" with {
  type: "json",
};

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
      // `license`, `meta_url` and `places_url` may be empty strings.
      const ces = data.datasets.find((d) => d.id === "calenviroscreen");
      assertEquals(ces?.meta_url, "");
      const pesticides = data.datasets.find((d) => d.id === "pesticide-use");
      assertEquals(pesticides?.license, "");
      assertEquals(pesticides?.meta_url, "/api/2.0/pesticides/meta/");
      assertEquals(pesticides?.places_url, "");
      assertEquals(pesticides?.entry_types.map((e) => e.id), [
        "pounds-applied",
        "acres-treated",
        "applications",
      ]);
      const notices = data.datasets.find((d) => d.id === "pesticide-notices");
      assertEquals(notices?.meta_url, "/api/2.0/pesticides/meta/");
      const weather = data.datasets.find((d) => d.id === "weather");
      assertEquals(weather?.places_url, "/api/2.0/monitors/?dataset=weather");
    });

    await t.step("monitors meta fixture matches the schema", () => {
      const data = monitorsMetaData;
      validateMonitorsMeta(data);
      assertEquals(data.available_pollutants.includes("pm25"), true);
    });

    await t.step("new scale, display, stages and processors fields", () => {
      const data = monitorsMetaData;
      const scale = data.entries.pm25.scale;
      assertExists(scale);
      assertEquals(scale.kind, "range");
      assertEquals(scale.levels[0].tier, 0);
      assertEquals(Object.keys(data.stages).includes("raw"), true);
      assertEquals(Object.keys(data.processors).length > 0, true);
      const pm25 = catalogData.datasets.find((d) => d.id === "air-quality")
        ?.entry_types.find((e) => e.id === "pm25");
      assertEquals(pm25?.display.chart, "line");
      assertEquals(pm25?.display.precision, 1);
    });

    await t.step("a set `retired` marker is accepted", () => {
      const data = structuredClone(catalogData);
      data.datasets[0].retired = { since: "2026-01-01T00:00:00-08:00" };
      data.datasets[1].entry_types[0].retired = {
        since: "2026-01-01T00:00:00-08:00",
        replaced_by: "pm25",
      };
      validateCatalog(data);
    });

    await t.step("unknown geographies and kinds are accepted", () => {
      const data = structuredClone(catalogData);
      data.datasets[0].geographies.push("watershed");
      data.datasets[0].entry_types[0].kind = "biological";
      validateCatalog(data);
    });
  },
});

// The local dev server may run a branch without these endpoints. On a 404 or
// any network error, skip the integration suite with a note; the fixture
// tests above always run.
let catalog: DatasetCatalog | undefined;
try {
  catalog = await getDatasetCatalog();
} catch (error) {
  if (!isUnavailable(error)) throw error;
  console.warn(
    "Skipping the meta/datasets integration steps: the endpoint is " +
      `unavailable (${(error as Error).message}).`,
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

const validateCoverage = getSimpleValidationTest(coverageSchema);

// The coverage fixtures were captured from the server code that serves
// meta/coverage, with purple-air, regions and default-calibrations loaded and
// a few entries and summaries created.
Deno.test({
  name: "Module: Meta Coverage (captured server responses)",
  async fn(t) {
    await t.step(
      "dataset-level, monitor, region and empty fixtures validate",
      () => {
        for (
          const fixture of [
            coverageDatasetFixture,
            coverageMonitorFixture,
            coverageRegionFixture,
            coverageEmptyFixture,
          ]
        ) {
          validateCoverage(fixture.data as unknown as Coverage);
        }
        const monitor = coverageMonitorFixture.data as unknown as Coverage;
        assertEquals(typeof monitor.monitor, "string");
        assertEquals(monitor.region, undefined);
        const region = coverageRegionFixture.data as unknown as Coverage;
        assertEquals(region.region, { type: "county", external_id: "06019" });
        assertEquals(region.monitor, undefined);
        const empty = coverageEmptyFixture.data as unknown as Coverage;
        assertEquals([empty.entry_type, empty.first, empty.last], [
          null,
          null,
          null,
        ]);
      },
    );

    await t.step("dates stay YYYY-MM-DD strings", async () => {
      const stub = stubFetch(() => jsonResponse(coverageRegionFixture));
      try {
        const coverage = await getCoverage({ dataset: "air-quality" });
        assertEquals(coverage.first, "2026-03-01");
        assertEquals(coverage.last, "2026-03-04");
      } finally {
        stub.restore();
      }
    });

    await t.step("a malformed date fails the schema", () => {
      const data = structuredClone(coverageDatasetFixture.data) as Coverage;
      data.first = "2026-01-01T00:00:00Z";
      assertEquals(coverageSchema.safeParse(data).success, false);
    });

    await t.step("query building", async () => {
      const stub = stubFetch(() => jsonResponse(coverageDatasetFixture));
      try {
        await getCoverage({ dataset: "hms-smoke" });
        await getCoverage({ dataset: "air-quality", entry_type: "pm25" });
        await getCoverage({
          dataset: "air-quality",
          entry_type: "pm25",
          monitor: "abc123",
        });
        await getCoverage({
          dataset: "air-quality",
          entry_type: "pm25",
          region: { type: "county", external_id: "06019" },
        });
        const params = stub.calls.map(({ url }) => {
          assertEquals(url.pathname.endsWith("/meta/coverage/"), true);
          return Object.fromEntries(url.searchParams);
        });
        assertEquals(params, [
          { dataset: "hms-smoke" },
          { dataset: "air-quality", entry_type: "pm25" },
          { dataset: "air-quality", entry_type: "pm25", monitor: "abc123" },
          {
            dataset: "air-quality",
            entry_type: "pm25",
            region_type: "county",
            region: "06019",
          },
        ]);
      } finally {
        stub.restore();
      }
    });

    await t.step("throws before any request on bad queries", async () => {
      const stub = stubFetch();
      try {
        await assertRejects(
          () =>
            getCoverage({
              dataset: "air-quality",
              entry_type: "pm25",
              monitor: "abc123",
              region: { type: "county", external_id: "06019" },
            }),
          Error,
          "either a monitor or a region",
        );
        await assertRejects(
          () =>
            getCoverage({
              dataset: "air-quality",
              entry_type: "pm25",
              // deno-lint-ignore no-explicit-any
              region: { type: "land_use", external_id: "x" } as any,
            }),
          Error,
          "Land-use",
        );
        assertEquals(stub.calls.length, 0);
      } finally {
        stub.restore();
      }
    });
  },
});

let airQualityCoverage: Coverage | undefined;
try {
  airQualityCoverage = await getCoverage({ dataset: "air-quality" });
} catch (error) {
  if (!isUnavailable(error)) throw error;
  console.warn(
    "Skipping the meta/coverage integration steps: the endpoint is " +
      `unavailable (${(error as Error).message}).`,
  );
}

Deno.test({
  name: "Module: Meta Coverage",
  permissions: { net: true, env: true },
  ignore: airQualityCoverage === undefined,
  async fn(t) {
    await t.step("GET  meta/coverage/ (dataset-level)", () => {
      const coverage = airQualityCoverage!;
      validateCoverage(coverage);
      assertEquals(coverage.dataset, "air-quality");
      if (coverage.first !== null && coverage.last !== null) {
        assertEquals(coverage.first <= coverage.last, true);
      } else {
        assertEquals([coverage.first, coverage.last], [null, null]);
      }
    });

    await t.step("GET  meta/coverage/ (monitor)", async () => {
      const monitor = Deno.env.get("TEST_MONITOR_ID");
      assertExists(monitor, "TEST_MONITOR_ID is not set");
      const coverage = await getCoverage({
        dataset: "air-quality",
        entry_type: "pm25",
        monitor,
      });
      validateCoverage(coverage);
      assertEquals(coverage.monitor, monitor);
    });
  },
});

Deno.test("Module: catalog entry aggregate", async (t) => {
  const data = catalogFixture.data as unknown as DatasetCatalog;
  const entry = (dataset: string, id: string) =>
    data.datasets.find((d) => d.id === dataset)?.entry_types.find((e) =>
      e.id === id
    );

  await t.step("the fixture says how each entry rolls up", () => {
    assertEquals(entry("pesticide-use", "pounds-applied")?.aggregate, "sum");
    assertEquals(entry("air-quality", "pm25")?.aggregate, "mean");
    assertEquals(entry("weather", "winddirection")?.aggregate, null);
  });

  await t.step("an entry type needs a known aggregate", () => {
    const pm25 = entry("air-quality", "pm25")!;
    const { aggregate: _, ...rest } = pm25;
    assertEquals(datasetEntryTypeSchema.safeParse(rest).success, false);
    assertEquals(
      datasetEntryTypeSchema.safeParse({ ...pm25, aggregate: "max" }).success,
      false,
    );
    assertEquals(datasetEntryTypeSchema.safeParse(pm25).success, true);
  });
});

Deno.test({
  name: "Scale averaging fields",
  async fn(t) {
    const pm25Scale = (monitorsMetaFixture as {
      data: { entries: { pm25: { scale: Record<string, unknown> } } };
    }).data.entries.pm25.scale;
    const withFields = (fields: Record<string, unknown>) => ({
      ...pm25Scale,
      averaging_hours: 24,
      daily_statistic: "mean_24h",
      daily_statistic_label: "24-hour average",
      ...fields,
    });

    await t.step("scale parses the averaging fields", () => {
      assertEquals(scaleSchema.safeParse(withFields({})).success, true);
      assertEquals(
        scaleSchema.safeParse(withFields({
          averaging_hours: null,
          daily_statistic: null,
          daily_statistic_label: null,
        })).success,
        true,
      );
    });

    await t.step("scale rejects a missing daily_statistic", () => {
      const { daily_statistic: _, ...missing } = withFields({});
      assertEquals(scaleSchema.safeParse(missing).success, false);
      assertEquals(
        scaleSchema.safeParse(withFields({ averaging_hours: 3 })).success,
        false,
      );
      assertEquals(
        scaleSchema.safeParse(withFields({ daily_statistic: "mean" })).success,
        false,
      );
    });

    await t.step("meta fixtures parse", () => {
      const parses = (
        schema: { safeParse(v: unknown): { success: boolean } },
        v: unknown,
      ) => assertEquals(schema.safeParse(v).success, true);
      parses(sjvairMonitorsMetaSchema, monitorsMetaFixture.data);
      parses(calHeatScoreMetaSchema, calHeatScoreMetaFixture.data);
      parses(hmsMetaSchema, hmsMetaFixture.data);
      parses(forecastsMetaSchema, forecastsMetaFixture.data);
    });

    await t.step("fixture scales carry the server's values", () => {
      const entries = monitorsMetaFixture.data.entries as Record<
        string,
        { scale: Record<string, unknown> | null }
      >;
      assertEquals(entries.pm25.scale?.daily_statistic, "mean_24h");
      assertEquals(entries.o3.scale?.daily_statistic, "max_1h");
      assertEquals(entries.co.scale?.averaging_hours, 8);
      assertEquals(
        entries.co.scale?.daily_statistic_label,
        "Highest 8-hour average",
      );
    });
  },
});
