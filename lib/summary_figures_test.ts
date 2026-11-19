import { assertEquals } from "@std/assert";
import { monitorSummarySchema } from "./monitors/schemas/monitor_summary.ts";
import { regionSummarySchema } from "./regions/schemas/region_summary.ts";
import type { MonitorSummary } from "./monitors/types.ts";
import type { RegionSummary } from "./regions/types.ts";
import type { DailyStatistic, PeriodStatistic } from "./meta/types.ts";

const monitorRow = {
  timestamp: "2026-11-09T00:00:00-08:00",
  entry_type: "pm25",
  resolution: "day",
  processor: "",
  count: 190,
  sum: 834.1,
  expected_count: 120,
  minimum: 1.4,
  maximum: 8,
  mean: 4.39,
  stddev: 1.08,
  p25: 3.64,
  p75: 5.04,
  max_1h: null,
  max_8h: null,
  mean_24h: 4.29,
  daily_statistic_mean: null,
  daily_statistic_days: null,
  daily_statistic_expected_days: null,
  is_complete: true,
  is_final: false,
} as const;

const { processor: _p, sum: _s, is_complete: _c, ...regionBase } = monitorRow;
const regionRow = { ...regionBase, station_count: 3 };

function without(row: Record<string, unknown>, key: string) {
  const { [key]: _, ...rest } = row;
  return rest;
}

const coarseRow = {
  ...monitorRow,
  timestamp: "2026-11-01T00:00:00-07:00",
  resolution: "month",
  mean_24h: null,
  daily_statistic_mean: null,
  daily_statistic_days: 0,
  daily_statistic_expected_days: 17,
} as const;

Deno.test("rows require the period daily statistic fields", () => {
  for (
    const key of [
      "daily_statistic_mean",
      "daily_statistic_days",
      "daily_statistic_expected_days",
    ]
  ) {
    assertEquals(
      monitorSummarySchema.safeParse(without(monitorRow, key)).success,
      false,
    );
    assertEquals(
      regionSummarySchema.safeParse(without(regionRow, key)).success,
      false,
    );
  }
});

Deno.test("a coarse row with no qualifying days parses", () => {
  assertEquals(monitorSummarySchema.safeParse(coarseRow).success, true);
  assertEquals(
    monitorSummarySchema.safeParse({
      ...coarseRow,
      daily_statistic_mean: 41.2,
      daily_statistic_days: 15,
    }).success,
    true,
  );
});

Deno.test("monitor row parses figures and is_final", () => {
  assertEquals(monitorSummarySchema.safeParse(monitorRow).success, true);
  assertEquals(
    monitorSummarySchema.safeParse(without(monitorRow, "is_final")).success,
    false,
  );
  assertEquals(
    monitorSummarySchema.safeParse(without(monitorRow, "mean_24h")).success,
    false,
  );
});

Deno.test("region row parses figures and is_final", () => {
  assertEquals(regionSummarySchema.safeParse(regionRow).success, true);
  assertEquals(
    regionSummarySchema.safeParse(without(regionRow, "is_final")).success,
    false,
  );
  assertEquals(
    regionSummarySchema.safeParse(without(regionRow, "max_1h")).success,
    false,
  );
});

// Compile-time check: a row indexed by a DailyStatistic is number | null.
function figure(
  row: MonitorSummary | RegionSummary,
  s: DailyStatistic,
): number | null {
  return row[s];
}

Deno.test("rows index by DailyStatistic", () => {
  assertEquals(
    figure(monitorSummarySchema.parse(monitorRow), "mean_24h"),
    4.29,
  );
  assertEquals(figure(regionSummarySchema.parse(regionRow), "max_1h"), null);
});

// Compile-time check: a row indexed by a PeriodStatistic is number | null.
function periodFigure(
  row: MonitorSummary | RegionSummary,
  s: PeriodStatistic,
): number | null {
  return row[s];
}

Deno.test("rows index by PeriodStatistic", () => {
  assertEquals(
    periodFigure(
      monitorSummarySchema.parse({
        ...coarseRow,
        daily_statistic_mean: 41.2,
        daily_statistic_days: 15,
      }),
      "daily_statistic_mean",
    ),
    41.2,
  );
});
