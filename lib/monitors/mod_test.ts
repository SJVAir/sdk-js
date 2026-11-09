import { origin, setOrigin } from "$http";
import {
  COORDINATES,
  EXISTING_MONITOR_ID,
  getSimpleValidationTest,
  isUnavailable,
} from "$testing";
import {
  monitorClosestSchema,
  monitorDataSchema,
  monitorDetailsSchema,
  monitorEntriesArchiveSchema,
  monitorLatestSchema,
  monitorSummarySchema,
  someMonitorEntrySchema,
} from "./schemas/mod.ts";
import { getMonitorsList } from "./get_monitors_list.ts";
import {
  getClosestMonitor,
  getClosestMonitors,
} from "./get_closest_monitor.ts";
import { getMonitors } from "./get_monitors.ts";
import { getMonitorDetails } from "./get_monitor_details.ts";
import type {
  MonitorEntryType,
  SJVAirMonitorsMeta,
  WeatherStationsForPlace,
} from "./types.ts";
import { getMonitorEntries } from "./get_monitor_entries.ts";
import {
  assert,
  assertEquals,
  assertExists,
  assertMatch,
  assertRejects,
  fail,
} from "@std/assert";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { getMonitorEntriesCSVUrl } from "./get_monitor_entries_csv.ts";
import {
  getMonitorEntriesExportCSVUrl,
  getMonitorEntriesExportJSON,
} from "./get_monitor_entries_export.ts";
import { getMonitorsMeta } from "./get_monitors_meta.ts";
import {
  sjvairEntryMetaSchema,
  sjvairMonitorEntryMetaSchema,
  sjvairMonitorsMetaSchema,
} from "./schemas/monitors_meta.ts";
import {
  listAllMonitorArchives,
  listMonitorArchivesPage,
} from "./get_monitor_archives.ts";
import {
  getMonitorSummariesDaily,
  getMonitorSummariesDailyOpen,
  getMonitorSummariesHourly,
  getMonitorSummariesMonthly,
  getMonitorSummariesQuarterly,
  getMonitorSummariesSeasonal,
  getMonitorSummariesYearly,
} from "./get_monitor_summaries.ts";
import {
  getMonitorSummariesBulkDaily,
  getMonitorSummariesBulkDailyOpen,
  mergeMonitorSummaryBulkPages,
} from "./get_monitor_summaries_bulk.ts";
import { warmOpenDays } from "../open_days_test_utils.ts";
import {
  monitorDewPointEntrySchema,
  monitorEntryTypeSchema,
  monitorSoilTemperatureEntrySchema,
  monitorWithSummariesSchema,
  weatherStationsForPlaceSchema,
} from "./schemas/mod.ts";
import { getWeatherStationsForPlace } from "./get_weather_stations_for_place.ts";
import weatherFixture from "./fixtures/weather_stations_for_place.json" with {
  type: "json",
};
import type {
  MonitorAlertCurrentRecord,
  MonitorWithSummaries,
} from "./types.ts";
import { getMonitorAlertCurrent } from "./get_monitor_alert_current.ts";
import {
  monitorAlertCurrentRecordSchema,
  monitorAlertCurrentSchema,
} from "./schemas/mod.ts";
import alertCurrentFixture from "./fixtures/monitor_alert_current.json" with {
  type: "json",
};
import monitorsMetaFixture from "./fixtures/monitors_meta.json" with {
  type: "json",
};

// Read here: the test blocks below only allow network access.
const isRemote = Deno.env.has("TEST_REMOTE");

if (!isRemote) {
  setOrigin("http://127.0.0.1:8000");
}

const primaryPollutants: Array<MonitorEntryType> = ["pm25", "o3"];

const validateMonitorData = getSimpleValidationTest(monitorDataSchema);
const validateMonitorLatest = getSimpleValidationTest(monitorLatestSchema);
const validateMonitorDetails = getSimpleValidationTest(monitorDetailsSchema);
const validateClosestMonitor = getSimpleValidationTest(monitorClosestSchema);
const validateMonitorEntries = getSimpleValidationTest(someMonitorEntrySchema);
const validateMonitorsMeta = getSimpleValidationTest(sjvairMonitorsMetaSchema);
const validateMonitorArchive = getSimpleValidationTest(
  monitorEntriesArchiveSchema,
);
const validateMonitorSummary = getSimpleValidationTest(
  monitorSummarySchema,
);
const validateMonitorWithSummaries = getSimpleValidationTest(
  monitorWithSummariesSchema,
);

Deno.test({
  name: "Module: Monitors Endpoints",
  permissions: { net: true },
  async fn(t) {
    // A server older than the available_pollutants field would fail the
    // schema on that field alone; skip with a note instead of failing.
    // TODO: remove this skip once available_pollutants is on develop
    const metaHasAvailablePollutants = Array.isArray(
      (await getMonitorsMeta()).available_pollutants,
    );
    if (!metaHasAvailablePollutants) {
      console.warn(
        "Skipping the monitors/meta schema step: the server's monitors/meta " +
          "has no available_pollutants.",
      );
    }

    await t.step({
      name: "GET   monitors/meta",
      ignore: !metaHasAvailablePollutants,
      fn: async () => validateMonitorsMeta(await getMonitorsMeta()),
    });

    await t.step(
      "GET   monitors/meta (vozbox single-sensor entries)",
      async () => {
        const meta = await getMonitorsMeta();
        const vozbox = meta.monitors.vozbox;

        assertExists(vozbox, "No vozbox entry found in monitors/meta response");
        assertEquals(vozbox.entries.o3.sensors, ["1"]);
        assertEquals(vozbox.entries.pm25.sensors, ["plantower", "sensirion"]);
      },
    );

    await t.step(
      "GET   monitors/meta (aqlite entries)",
      async () => {
        const meta = await getMonitorsMeta();
        const aqlite = meta.monitors.aqlite;

        assertExists(aqlite, "No aqlite entry found in monitors/meta response");
        assertEquals(aqlite.entries.o3.sensors, null);
      },
    );

    await t.step(
      "GET  monitors/",
      async () => validateMonitorData(await getMonitorsList()),
    );

    await t.step("GET  monitors/?dataset=weather", async () => {
      const stations = await getMonitorsList({ dataset: "weather" });
      validateMonitorData(stations);
      if (stations.length === 0) {
        console.warn("Skipping CIMIS checks: no weather stations returned.");
        return;
      }
      assertEquals(stations.every((m) => m.type === "cimis"), true);
    });

    await t.step("GET  monitors/?dataset=air-quality", async () => {
      validateMonitorData(await getMonitorsList({ dataset: "air-quality" }));
    });

    await t.step("GET  monitors/ (vozbox monitor type)", async () => {
      const monitors = await getMonitorsList();
      const vozbox = monitors.find((monitor) => monitor.type === "vozbox");

      assertExists(vozbox, "No vozbox monitor found in monitors/ response");
      assertEquals(typeof vozbox.sensor_id, "string");
      assertEquals(["fem", "frm", "lcs"].includes(vozbox.grade ?? ""), true);
    });

    // Some steps need data a local copy of the server may not have. They're
    // skipped (shown as "ignored") with a note, instead of failing.
    const hasAqlite = (await getMonitorsList()).some((monitor) =>
      monitor.type === "aqlite"
    );
    if (!hasAqlite) {
      console.warn(
        "Skipping the aqlite monitor step: the server has no aqlite monitors.",
      );
    }

    const hasCurrentPm25 = (await getMonitors("pm25")).length > 0;
    if (!hasCurrentPm25) {
      console.warn(
        "Skipping the closest-monitor steps: no monitor has a current pm25 " +
          "reading (common with a local server whose data isn't recent).",
      );
    }

    await t.step({
      name: "GET  monitors/ (aqlite monitor type)",
      ignore: !hasAqlite,
      fn: async () => {
        const monitors = await getMonitorsList();
        const aqlite = monitors.find((monitor) => monitor.type === "aqlite");

        assertExists(aqlite, "No aqlite monitor found in monitors/ response");
        assertEquals(typeof aqlite.device_id, "string");
        assertEquals(["fem", "frm", "lcs"].includes(aqlite.grade ?? ""), true);
      },
    });

    await t.step(
      "GET  monitors/{MONITOR_ID}/",
      async () =>
        validateMonitorDetails(await getMonitorDetails(EXISTING_MONITOR_ID)),
    );

    await t.step({
      name: "GET  monitors/{ENTRY_TYPE}/closest/",
      ignore: !hasCurrentPm25,
      fn: async () =>
        validateClosestMonitor(
          await getClosestMonitors(
            "pm25",
            COORDINATES.latitude,
            COORDINATES.longitude,
          ),
        ),
    });

    await t.step({
      name: "GET  monitors/{ENTRY_TYPE}/closest/ (single monitor validation)",
      ignore: !hasCurrentPm25,
      fn: async () =>
        validateClosestMonitor(
          await getClosestMonitor(
            "pm25",
            COORDINATES.latitude,
            COORDINATES.longitude,
          ),
        ),
    });

    await t.step(
      "GET  monitors/{MONITOR_ID}/archive/",
      async () => {
        const page = await listMonitorArchivesPage(EXISTING_MONITOR_ID);
        validateMonitorArchive(page.data);

        const archives = await listAllMonitorArchives(EXISTING_MONITOR_ID);
        validateMonitorArchive(archives);
      },
    );

    for (const pollutant of primaryPollutants) {
      await t.step(
        `GET  monitors/${pollutant}/current/`,
        async () => validateMonitorLatest(await getMonitors(pollutant)),
      );

      await t.step(
        `GET  monitors/${pollutant}/at/`,
        async () =>
          validateMonitorLatest(
            await getMonitors(pollutant, { timestamp: new Date() }),
          ),
      );

      await t.step(
        `GET  monitors/{MONITOR_ID}/entries/${pollutant}/`,
        async () =>
          validateMonitorEntries(
            await getMonitorEntries({
              entryType: pollutant,
              monitorId: EXISTING_MONITOR_ID,
            }),
          ),
      );

      await t.step("Generate CSV Download", async (t2) => {
        await t2.step(
          `Get  /api/2.0/monitors/{MONITOR_ID}/entries/${pollutant}/csv/`,
          async (t3) => {
            const url = getMonitorEntriesCSVUrl({
              entryType: pollutant,
              monitorId: EXISTING_MONITOR_ID,
            });

            assertEquals(url.origin, origin);
            assertEquals(
              url.pathname,
              `/api/2.0/monitors/${EXISTING_MONITOR_ID}/entries/${pollutant}/csv/`,
            );
            assertEquals(url.searchParams.has("timestamp__gte"), true);
            assertEquals(url.searchParams.has("timestamp__lte"), true);

            await t3.step("Fetch entries CSV", async () => {
              const response = await fetch(url);

              if (response.status !== 200) {
                fail("Monitor Entries CSV request failed");
              }
              const contentType = response.headers.get("content-type");
              const contentDispostion = response.headers.get(
                "content-disposition",
              );

              assertExists(contentType, "No Content-Type header");
              assertExists(contentDispostion, "No Content-Disposition header");

              assertEquals(contentType, "text/csv");
              assertEquals(
                contentDispostion.includes(`${EXISTING_MONITOR_ID}_export.csv`),
                true,
              );

              try {
                await response.text();
              } catch (error) {
                fail(
                  `Monitor Entries endpoint response is not text: ${
                    JSON.stringify(
                      error,
                      undefined,
                      2,
                    )
                  }`,
                );
              }
            });
          },
        );
      });

      await t.step(
        `GET  monitors/{MONITOR_ID}/entries/export/json/`,
        async () => {
          const startDate = "2024-01-01";
          const endDate = "2024-01-02";

          const records = await getMonitorEntriesExportJSON({
            monitorId: EXISTING_MONITOR_ID,
            startDate,
            endDate,
          });

          assertEquals(Array.isArray(records), true);
        },
      );

      await t.step(
        `Get  monitors/{MONITOR_ID}/entries/export/csv/`,
        async () => {
          const url = getMonitorEntriesExportCSVUrl({
            monitorId: EXISTING_MONITOR_ID,
            startDate: "2024-01-01",
            endDate: "2024-01-02",
          });

          assertEquals(url.origin, origin);
          assertEquals(
            url.pathname,
            `/api/2.0/monitors/${EXISTING_MONITOR_ID}/entries/export/csv/`,
          );

          const response = await fetch(url);

          if (response.status !== 200) {
            fail("Monitor Entries export CSV request failed");
          }
          assertEquals(response.headers.get("content-type"), "text/csv");
        },
      );

      // Summaries may legitimately come back empty: hourly/daily are filled in by a
      // periodic task over time, and monthly/quarterly/seasonal/yearly only exist
      // after that task's once-daily rollup (or a manual `rebuild_summaries` run) has
      // happened for this monitor. These steps only assert response shape, not content.
      await t.step(
        `GET  monitors/{MONITOR_ID}/summaries/${pollutant}/*`,
        async (t2) => {
          const year = new Date().getFullYear();

          await t2.step("hourly", async () =>
            validateMonitorSummary(
              await getMonitorSummariesHourly({
                monitorId: EXISTING_MONITOR_ID,
                entryType: pollutant,
                year,
              }),
            ));

          await t2.step("daily", async () =>
            validateMonitorSummary(
              await getMonitorSummariesDaily({
                monitorId: EXISTING_MONITOR_ID,
                entryType: pollutant,
                year,
              }),
            ));

          await t2.step("monthly", async () =>
            validateMonitorSummary(
              await getMonitorSummariesMonthly({
                monitorId: EXISTING_MONITOR_ID,
                entryType: pollutant,
                year,
              }),
            ));

          await t2.step("quarterly", async () =>
            validateMonitorSummary(
              await getMonitorSummariesQuarterly({
                monitorId: EXISTING_MONITOR_ID,
                entryType: pollutant,
                year,
              }),
            ));

          await t2.step("seasonal", async () =>
            validateMonitorSummary(
              await getMonitorSummariesSeasonal({
                monitorId: EXISTING_MONITOR_ID,
                entryType: pollutant,
                year,
              }),
            ));

          await t2.step("yearly", async () =>
            validateMonitorSummary(
              await getMonitorSummariesYearly({
                monitorId: EXISTING_MONITOR_ID,
                entryType: pollutant,
              }),
            ));
        },
      );
    }

    // Bulk summaries are paginated by row, not by monitor - a wide-open
    // date range/no region filter is enough to exercise the endpoint's
    // shape; the split/merge behavior itself is covered separately below
    // with fixture data, since the live server's page size (168 rows)
    // isn't practical to force through this integration test.
    await t.step(
      "GET  monitors/{entry_type}/summaries/daily",
      async () => {
        const today = new Date();
        const start = new Date(today);
        start.setDate(start.getDate() - 7);

        validateMonitorWithSummaries(
          await getMonitorSummariesBulkDaily({
            entryType: "pm25",
            start,
            end: today,
          }),
        );

        // An explicit processor is an exact match across all monitors,
        // rather than each monitor's default published series.
        validateMonitorWithSummaries(
          await getMonitorSummariesBulkDaily({
            entryType: "pm25",
            start,
            end: today,
            processor: "",
          }),
        );
      },
    );

    // Open days are built from today's hours; a local stack can have none
    // (it runs part of the day), so an empty answer is noted, not a failure.
    await t.step({
      name: "GET  monitors/{MONITOR_ID}/summaries/pm25/daily/open/",
      ignore: isRemote,
      fn: async () => {
        await warmOpenDays(
          `monitors/${EXISTING_MONITOR_ID}/summaries/pm25/daily/open`,
        );
        const rows = await getMonitorSummariesDailyOpen({
          monitorId: EXISTING_MONITOR_ID,
          entryType: "pm25",
        });
        if (!rows.length) {
          console.warn("No open-day rows for TEST_MONITOR_ID (local data gap)");
        }
        validateMonitorSummary(rows);
        for (const row of rows) {
          assertEquals(row.resolution, "day");
          assertEquals(row.is_final, false);
        }
      },
    });

    await t.step({
      name: "GET  monitors/{entry_type}/summaries/daily/open/",
      ignore: isRemote,
      fn: async () => {
        await warmOpenDays("monitors/pm25/summaries/daily/open");
        const monitors = await getMonitorSummariesBulkDailyOpen({
          entryType: "pm25",
        });
        if (!monitors.length) {
          console.warn("No monitors with open-day rows (local data gap)");
        }
        validateMonitorWithSummaries(monitors);
        const ids = monitors.map((m) => m.id);
        assertEquals(new Set(ids).size, ids.length);
        for (const monitor of monitors) {
          const days = monitor.summaries.map((row) => row.timestamp);
          assertEquals(new Set(days).size, days.length);
          for (const row of monitor.summaries) {
            assertEquals(row.is_final, false);
          }
        }
      },
    });
  },
});

Deno.test({
  name: "monitorSummarySchema requires sum",
  permissions: { net: false },
  fn() {
    const row = {
      timestamp: "2024-01-01T00:00:00-08:00",
      entry_type: "precipitation",
      resolution: "day",
      processor: "",
      count: 24,
      sum: 12.0,
      expected_count: 24,
      minimum: 0,
      maximum: 2.5,
      mean: 0.5,
      stddev: 0.7,
      p25: 0,
      p75: 0.8,
      max_1h: null,
      max_8h: null,
      mean_24h: null,
      is_complete: true,
      is_final: true,
    };
    assert(monitorSummarySchema.safeParse(row).success);
    const { sum: _sum, ...noSum } = row;
    assert(!monitorSummarySchema.safeParse(noSum).success);
  },
});

Deno.test({
  name: "mergeMonitorSummaryBulkPages",
  permissions: { net: false },
  fn() {
    const summary = (timestamp: string) => ({
      timestamp,
      entry_type: "pm25",
      resolution: "day",
      processor: "",
      count: 288,
      sum: 1612.8,
      expected_count: 288,
      minimum: 2.1,
      maximum: 9.4,
      mean: 5.6,
      stddev: 1.2,
      p25: 4.5,
      p75: 6.7,
      max_1h: null,
      max_8h: null,
      mean_24h: 5.4,
      is_complete: true,
      is_final: true,
    });

    const monitor = (
      id: string,
      summaries: ReturnType<typeof summary>[],
    ): MonitorWithSummaries => ({
      id,
      summaries,
    } as unknown as MonitorWithSummaries);

    // Simulates a monitor ("split-monitor") whose rows didn't fit on a single
    // page: it appears at the end of page 1 with a partial `summaries` array,
    // and again at the start of page 2 with the rest.
    const page1 = [
      monitor("whole-monitor", [summary("2024-01-01"), summary("2024-01-02")]),
      monitor("split-monitor", [summary("2024-01-01")]),
    ];
    const page2 = [
      monitor("split-monitor", [summary("2024-01-02"), summary("2024-01-03")]),
      monitor("another-monitor", [summary("2024-01-01")]),
    ];

    const merged = mergeMonitorSummaryBulkPages([page1, page2]);

    assertEquals(merged.map((m) => m.id), [
      "whole-monitor",
      "split-monitor",
      "another-monitor",
    ]);

    const splitMonitor = merged.find((m) => m.id === "split-monitor");
    assertExists(splitMonitor);
    assertEquals(
      splitMonitor.summaries.map((s) => s.timestamp),
      ["2024-01-01", "2024-01-02", "2024-01-03"],
    );
  },
});

Deno.test("Module: Monitors request params (stubbed fetch)", async (t) => {
  const emptyPage = () =>
    jsonResponse({ data: [], has_next_page: false, page: 1, pages: 1 });
  const zoned = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

  await t.step(
    "getMonitorEntries sends processor and stage when given",
    async () => {
      const stub = stubFetch(emptyPage);
      try {
        await getMonitorEntries({
          monitorId: "m",
          entryType: "pm25",
          processor: "PM25_UnitedStates",
          stage: "calibrated",
        });
      } finally {
        stub.restore();
      }

      assertEquals(stub.calls.length, 1);
      const params = stub.calls[0].url.searchParams;
      assertEquals(params.get("processor"), "PM25_UnitedStates");
      assertEquals(params.get("stage"), "calibrated");
    },
  );

  await t.step(
    "getMonitorEntries omits processor and stage otherwise",
    async () => {
      const stub = stubFetch(emptyPage);
      try {
        await getMonitorEntries({ monitorId: "m", entryType: "pm25" });
      } finally {
        stub.restore();
      }

      const params = stub.calls[0].url.searchParams;
      assertEquals(params.has("processor"), false);
      assertEquals(params.has("stage"), false);
    },
  );

  await t.step("getMonitorEntries sends Z bounds, even past now", async () => {
    const stub = stubFetch(emptyPage);
    try {
      await getMonitorEntries({
        monitorId: "m",
        entryType: "pm25",
        timestampGte: new Date("2026-10-22T07:00:00Z"),
        timestampLte: new Date(Date.now() + 6 * 3600_000),
      });
    } finally {
      stub.restore();
    }

    const params = stub.calls[0].url.searchParams;
    assertEquals(params.get("timestamp__gte"), "2026-10-22T07:00:00.000Z");
    assertMatch(params.get("timestamp__lte")!, zoned);
  });

  await t.step(
    "getMonitorEntries sends close bounds unchanged by default",
    async () => {
      const stub = stubFetch(emptyPage);
      try {
        await getMonitorEntries({
          monitorId: "m",
          entryType: "pm25",
          timestampGte: new Date("2026-10-22T18:00:30.250Z"),
          timestampLte: new Date("2026-10-22T18:02:10.500Z"),
        });
      } finally {
        stub.restore();
      }

      const params = stub.calls[0].url.searchParams;
      assertEquals(params.get("timestamp__gte"), "2026-10-22T18:00:30.250Z");
      assertEquals(params.get("timestamp__lte"), "2026-10-22T18:02:10.500Z");
    },
  );

  await t.step(
    "getMonitorEntries wholeDays rounds to Pacific days",
    async () => {
      const stub = stubFetch(emptyPage);
      try {
        await getMonitorEntries({
          monitorId: "m",
          entryType: "pm25",
          timestampGte: "2026-11-02T17:00:00Z",
          timestampLte: "2026-11-04T11:00:00Z",
          wholeDays: true,
        });
      } finally {
        stub.restore();
      }

      const params = stub.calls[0].url.searchParams;
      assertEquals(params.get("timestamp__gte"), "2026-11-02T08:00:00.000Z");
      assertEquals(params.get("timestamp__lte"), "2026-11-05T07:59:59.999Z");
      assertEquals(params.has("wholeDays"), false);
    },
  );

  await t.step(
    "getMonitorEntriesCSVUrl sends close bounds unchanged by default",
    () => {
      const params = getMonitorEntriesCSVUrl({
        monitorId: "m",
        entryType: "pm25",
        timestampGte: new Date("2026-10-22T18:00:30.250Z"),
        timestampLte: new Date("2026-10-22T18:02:10.500Z"),
      }).searchParams;
      assertEquals(params.get("timestamp__gte"), "2026-10-22T18:00:30.250Z");
      assertEquals(params.get("timestamp__lte"), "2026-10-22T18:02:10.500Z");
    },
  );

  await t.step(
    "getMonitorEntriesCSVUrl wholeDays rounds to Pacific days",
    () => {
      const params = getMonitorEntriesCSVUrl({
        monitorId: "m",
        entryType: "pm25",
        timestampGte: "2026-11-02T17:00:00Z",
        timestampLte: "2026-11-04T11:00:00Z",
        wholeDays: true,
      }).searchParams;
      assertEquals(params.get("timestamp__gte"), "2026-11-02T08:00:00.000Z");
      assertEquals(params.get("timestamp__lte"), "2026-11-05T07:59:59.999Z");
      assertEquals(params.has("wholeDays"), false);
    },
  );

  await t.step(
    "getMonitorEntriesCSVUrl sends processor and stage when given",
    () => {
      const url = getMonitorEntriesCSVUrl({
        monitorId: "m",
        entryType: "pm25",
        processor: "PM25_UnitedStates",
        stage: "calibrated",
      });
      assertEquals(url.searchParams.get("processor"), "PM25_UnitedStates");
      assertEquals(url.searchParams.get("stage"), "calibrated");
    },
  );

  await t.step(
    "getMonitorEntriesCSVUrl omits processor and stage otherwise",
    () => {
      const url = getMonitorEntriesCSVUrl({
        monitorId: "m",
        entryType: "pm25",
      });
      assertEquals(url.searchParams.has("processor"), false);
      assertEquals(url.searchParams.has("stage"), false);
    },
  );

  await t.step("getMonitors at/ sends a Z timestamp", async () => {
    const stub = stubFetch(() => jsonResponse({ data: [] }));
    try {
      await getMonitors("pm25", { timestamp: "2026-10-22T00:00:00-07:00" });
    } finally {
      stub.restore();
    }

    assertEquals(
      stub.calls[0].url.searchParams.get("timestamp"),
      "2026-10-22T07:00:00.000Z",
    );
  });

  await t.step("getMonitorEntriesCSVUrl sends Z bounds", () => {
    const url = getMonitorEntriesCSVUrl({
      monitorId: "m",
      entryType: "pm25",
      timestampGte: new Date("2026-10-22T12:00:00Z"),
      timestampLte: new Date("2026-10-22T12:01:00Z"),
    });

    assertEquals(
      url.searchParams.get("timestamp__gte"),
      "2026-10-22T12:00:00.000Z",
    );
    assertEquals(
      url.searchParams.get("timestamp__lte"),
      "2026-10-22T12:01:00.000Z",
    );
  });
});

Deno.test("Module: Monitors meta scales (stubbed fetch)", async (t) => {
  const fetchMeta = async (data: unknown) => {
    const stub = stubFetch(() => jsonResponse({ data }));
    try {
      return await getMonitorsMeta();
    } finally {
      stub.restore();
    }
  };

  await t.step("exposes scales, tiers, stages and processors", async () => {
    const meta = await fetchMeta(monitorsMetaFixture.data);
    const scale = meta.entryType("pm25").scale;
    assertExists(scale);
    assertEquals(scale.levels[0].tier, 0);
    assertEquals(meta.stages.raw.key, "raw");
    assertEquals(meta.asIter.stages.length, Object.keys(meta.stages).length);
    assertEquals(
      meta.asIter.processors.length,
      Object.keys(meta.processors).length,
    );
  });

  await t.step("exposes school guidelines for pm25 only", async () => {
    const meta = await fetchMeta(monitorsMetaFixture.data);
    const pm25 = meta.entryType("pm25");
    const guidelines = pm25.school_guidelines;
    assertExists(guidelines);
    assertEquals(guidelines.label, "Outdoor Activity Guidelines for Schools");
    assertEquals(guidelines.resolution, "hour");
    assertEquals(
      guidelines.source.url,
      "https://www.sjvair.com/guidelines/schools/",
    );
    assertEquals(
      guidelines.activities.map((a) => a.key),
      ["recess", "pe", "athletics", "events"],
    );
    assertEquals(
      guidelines.activities.map((a) => a.duration),
      ["15 minutes", "1 hour", "2-4 hours", null],
    );
    const levelKeys = pm25.scale!.levels.map((l) => l.key);
    for (const activity of guidelines.activities) {
      assertEquals(Object.keys(activity.levels), levelKeys);
      for (const paragraphs of Object.values(activity.levels)) {
        assert(paragraphs.length > 0);
        for (const text of paragraphs) {
          assert(!text.includes("<") && !text.includes("&amp;"), text);
        }
      }
    }
    assertEquals(guidelines.activities[0].levels.good, ["No restrictions."]);
    for (const entry of meta.asIter.entries) {
      if (entry.type === "pm25") continue;
      assertEquals(entry.school_guidelines, null, entry.type);
    }
    validateMonitorsMeta(
      monitorsMetaFixture.data as unknown as SJVAirMonitorsMeta,
    );
  });

  await t.step("has no legacy levels", async () => {
    assertEquals("levels" in sjvairEntryMetaSchema.shape, false);
    const meta = await fetchMeta(monitorsMetaFixture.data);
    const pm25 = meta.entryType("pm25");
    assertEquals("levels" in pm25, false);
    assertEquals("asIter" in pm25, false);
    for (const entry of Object.values(monitorsMetaFixture.data.entries)) {
      assertEquals("levels" in entry, false);
    }
  });
});

Deno.test("Module: Monitors meta alerts block", async (t) => {
  const entryMeta = {
    sensors: ["a", "b"],
    allowed_stages: ["raw", "calibrated"],
    default_stage: "calibrated",
    default_calibration: "PM25_UnivariateLinearRegression",
    processors: { raw: ["PM25_UnivariateLinearRegression"] },
  };
  const alerts = {
    window: "60 min",
    min_coverage: 0.5,
    stage: "calibrated",
    processor: "PM25_UnivariateLinearRegression",
    expected_interval: null,
  };

  await t.step("entry meta parses an alerts block", () => {
    const parsed = sjvairMonitorEntryMetaSchema.parse({ ...entryMeta, alerts });
    assertEquals(parsed.alerts, alerts);
  });

  await t.step("entry meta parses alerts null", () => {
    const parsed = sjvairMonitorEntryMetaSchema.parse({
      ...entryMeta,
      alerts: null,
    });
    assertEquals(parsed.alerts, null);
  });

  await t.step("entry meta requires alerts", () => {
    assertEquals(
      sjvairMonitorEntryMetaSchema.safeParse(entryMeta).success,
      false,
    );
  });

  await t.step("the fixture carries alerts on every entry", () => {
    validateMonitorsMeta(
      monitorsMetaFixture.data as unknown as SJVAirMonitorsMeta,
    );
    const monitors = sjvairMonitorsMetaSchema.parse(monitorsMetaFixture.data)
      .monitors;
    assertEquals(monitors.purpleair.entries.pm25.alerts, alerts);
    assertEquals(monitors.purpleair.entries.pm100.alerts, null);
    assertEquals(monitors.aqlite.entries.o3.alerts?.expected_interval, "1h");
    assertEquals(monitors.airnow.entries.o3.alerts?.processor, null);
  });
});

Deno.test("getMonitorsList sends dataset as a query param, not fetch init", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    await getMonitorsList({ dataset: "weather" });
    await getMonitorsList({ dataset: "weather", signal: undefined });
  } finally {
    stub.restore();
  }
  assertEquals(stub.calls[0].url.searchParams.get("dataset"), "weather");
  assertEquals("dataset" in stub.calls[0].init, false);
});

Deno.test("getMonitorsList without dataset sends no dataset param", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [{ id: "m" }] }));
  try {
    await getMonitorsList();
  } finally {
    stub.restore();
  }
  assertEquals(stub.calls[0].url.searchParams.has("dataset"), false);
});

Deno.test("getMonitorsList still rejects an empty default list", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    await assertRejects(() => getMonitorsList());
  } finally {
    stub.restore();
  }
});

Deno.test("getMonitorsList treats an empty dataset as absent", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    await assertRejects(() => getMonitorsList({ dataset: "" }));
  } finally {
    stub.restore();
  }
  assertEquals(stub.calls[0].url.searchParams.has("dataset"), false);
});

Deno.test("getMonitorsList sends one region", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    await getMonitorsList({ region: "abc" });
  } finally {
    stub.restore();
  }
  assertEquals(stub.calls[0].url.searchParams.getAll("region"), ["abc"]);
});

Deno.test("getMonitorsList repeats region for several ids", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    await getMonitorsList({ region: ["abc", "def"] });
  } finally {
    stub.restore();
  }
  assertEquals(stub.calls[0].url.searchParams.getAll("region"), [
    "abc",
    "def",
  ]);
});

Deno.test("getMonitorsList sends region with dataset", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    assertEquals(
      await getMonitorsList({ region: "abc", dataset: "weather" }),
      [],
    );
  } finally {
    stub.restore();
  }
  const { searchParams } = stub.calls[0].url;
  assertEquals(searchParams.getAll("region"), ["abc"]);
  assertEquals(searchParams.get("dataset"), "weather");
});

Deno.test("getMonitorsList drops empty region values", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    await getMonitorsList({ region: ["", "abc"] });
    await assertRejects(() => getMonitorsList({ region: "" }));
    await assertRejects(() => getMonitorsList({ region: [] }));
  } finally {
    stub.restore();
  }
  assertEquals(stub.calls[0].url.searchParams.getAll("region"), ["abc"]);
  assertEquals(stub.calls[1].url.searchParams.has("region"), false);
  assertEquals(stub.calls[2].url.searchParams.has("region"), false);
});

Deno.test("getMonitorsList sends region only in the URL", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    await getMonitorsList({
      region: "abc",
      init: { headers: { "X-Test": "1" } },
    });
  } finally {
    stub.restore();
  }
  const { url, init } = stub.calls[0];
  assertEquals(url.searchParams.getAll("region"), ["abc"]);
  assertEquals(new Headers(init.headers).get("X-Test"), "1");
  const { headers: _, ...rest } = init;
  assertEquals(JSON.stringify(rest).includes("abc"), false);
  assertEquals(
    [...new Headers(init.headers).values()].includes("abc"),
    false,
  );
});

Deno.test("getMonitorsList with region resolves an empty list", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    assertEquals(await getMonitorsList({ region: "abc" }), []);
  } finally {
    stub.restore();
  }
});

Deno.test("MonitorEntryType includes the CIMIS weather types", () => {
  const ids = [
    "temperature",
    "humidity",
    "dewpoint",
    "soiltemperature",
    "windspeed",
    "winddirection",
    "precipitation",
    "solarradiation",
    "netradiation",
    "vaporpressure",
    "eto",
    "etr",
  ];
  for (const id of ids) {
    assert(monitorEntryTypeSchema.safeParse(id).success, id);
  }
  const t: MonitorEntryType = "eto";
  assertEquals(t, "eto");
});

Deno.test("Module: Monitors weather stations for a place", async (t) => {
  const validate = getSimpleValidationTest(weatherStationsForPlaceSchema);
  // JSON imports widen string literals, so state the shape the schema will check.
  const data = weatherFixture.data as unknown as WeatherStationsForPlace;

  await t.step("fixture matches the schema", () => {
    validate(data);
    assertEquals(data.stations[0].inside, true);
    assertEquals(data.stations[0].distance, 0); // the doc example's "0"
  });

  await t.step("sends a region and returns stations", async () => {
    const stub = stubFetch(() => jsonResponse(weatherFixture));
    try {
      const result = await getWeatherStationsForPlace({
        region: { type: "county", external_id: "06019" },
      });
      const { pathname, searchParams } = stub.calls[0].url;
      assertEquals(pathname, "/api/2.0/monitors/weather/place/");
      assertEquals(searchParams.get("region_type"), "county");
      assertEquals(searchParams.get("region"), "06019");
      assertEquals(result.stations[0].inside, true);
    } finally {
      stub.restore();
    }
  });

  await t.step("sends a monitor and no region", async () => {
    const stub = stubFetch(() => jsonResponse(weatherFixture));
    try {
      await getWeatherStationsForPlace({ monitor: "abc" });
      const { searchParams } = stub.calls[0].url;
      assertEquals(searchParams.get("monitor"), "abc");
      assertEquals(searchParams.has("region"), false);
      assertEquals(searchParams.has("region_type"), false);
    } finally {
      stub.restore();
    }
  });

  await t.step("refuses land use before fetching", async () => {
    const stub = stubFetch(() => jsonResponse(weatherFixture));
    try {
      await assertRejects(
        () =>
          getWeatherStationsForPlace({
            // deno-lint-ignore no-explicit-any
            region: { type: "land_use" as any, external_id: "1" },
          }),
        Error,
        "Land-use regions can't be looked up by code",
      );
      assertEquals(stub.calls.length, 0);
    } finally {
      stub.restore();
    }
  });

  await t.step("GET  monitors/weather/place/ for Fresno County", async () => {
    try {
      const result = await getWeatherStationsForPlace({
        region: { type: "county", external_id: "06019" },
      });
      validate(result);
    } catch (error) {
      if (!isUnavailable(error)) throw error;
      console.warn("monitors/weather/place/ unavailable; skipping.");
    }
  });
});

Deno.test("Module: Monitors dew point and soil temperature entries", () => {
  const base = {
    timestamp: "2026-11-05T12:00:00-08:00",
    sensor: "",
    stage: "raw",
    processor: "",
  };
  const dew = {
    ...base,
    entry_type: "dewpoint",
    dew_point_f: "41.0",
    dew_point_c: "5.0",
  };
  assert(monitorDewPointEntrySchema.safeParse(dew).success);
  assert(someMonitorEntrySchema.safeParse(dew).success);
  const { dew_point_f: _f, ...noF } = dew;
  assert(!monitorDewPointEntrySchema.safeParse(noF).success);
  assert(!someMonitorEntrySchema.safeParse(noF).success);

  const soil = {
    ...base,
    entry_type: "soiltemperature",
    soil_temperature_f: "55.0",
    soil_temperature_c: "12.8",
  };
  assert(monitorSoilTemperatureEntrySchema.safeParse(soil).success);
  assert(someMonitorEntrySchema.safeParse(soil).success);
  const { soil_temperature_f: _g, ...noSoil } = soil;
  assert(!monitorSoilTemperatureEntrySchema.safeParse(noSoil).success);
});

Deno.test({
  name: "Module: Monitor alert current (stubbed fetch)",
  permissions: { net: false },
  fn: async (t) => {
    await t.step("monitorAlertCurrentRecordSchema parses the fixture", () => {
      assert(
        monitorAlertCurrentRecordSchema.safeParse(alertCurrentFixture).success,
      );
    });

    await t.step("monitorAlertCurrentSchema accepts a pending row", () => {
      const pending = {
        status: "pending",
        value: null,
        level: null,
        window: null,
        latest_timestamp: null,
        readings: null,
        required: null,
        previous: null,
        evaluated_at: null,
      };
      assert(monitorAlertCurrentSchema.safeParse(pending).success);
      // An inactive monitor with no stored result has the same shape.
      assert(
        monitorAlertCurrentSchema.safeParse({ ...pending, status: "no_data" })
          .success,
      );
    });

    await t.step(
      "monitorAlertCurrentSchema requires previous.latest_timestamp",
      () => {
        const { latest_timestamp: _, ...previous } = alertCurrentFixture.pm25
          .previous;
        assert(
          !monitorAlertCurrentSchema.safeParse({
            ...alertCurrentFixture.pm25,
            previous,
          }).success,
        );
      },
    );

    await t.step("monitorAlertCurrentSchema rejects an unknown status", () => {
      const row = { ...alertCurrentFixture.pm25, status: "stale" };
      assert(!monitorAlertCurrentSchema.safeParse(row).success);
      const previous = {
        ...alertCurrentFixture.pm25.previous,
        status: "stale",
      };
      assert(
        !monitorAlertCurrentSchema.safeParse({
          ...alertCurrentFixture.pm25,
          previous,
        }).success,
      );
    });

    await t.step("getMonitorAlertCurrent calls alerts/current", async () => {
      const stub = stubFetch(() => jsonResponse({ data: alertCurrentFixture }));
      try {
        const result = await getMonitorAlertCurrent("abc");
        assertEquals(result, alertCurrentFixture as MonitorAlertCurrentRecord);
        assertEquals(
          stub.calls[0].url.pathname,
          "/api/2.0/monitors/abc/alerts/current/",
        );
      } finally {
        stub.restore();
      }
    });

    await t.step("getMonitorAlertCurrent returns an empty record", async () => {
      const stub = stubFetch(() => jsonResponse({ data: {} }));
      try {
        assertEquals(await getMonitorAlertCurrent("abc"), {});
      } finally {
        stub.restore();
      }
    });
  },
});
