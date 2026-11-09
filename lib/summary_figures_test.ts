import { assertEquals } from "@std/assert";
import { monitorSummarySchema } from "./monitors/schemas/monitor_summary.ts";
import { regionSummarySchema } from "./regions/schemas/region_summary.ts";
import type { MonitorSummary } from "./monitors/types.ts";
import type { RegionSummary } from "./regions/types.ts";
import type { DailyStatistic } from "./meta/types.ts";

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
  is_complete: true,
  is_final: false,
} as const;

const { processor: _p, sum: _s, is_complete: _c, ...regionBase } = monitorRow;
const regionRow = { ...regionBase, station_count: 3 };

function without(row: Record<string, unknown>, key: string) {
  const { [key]: _, ...rest } = row;
  return rest;
}

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
