import { assertEquals } from "@std/assert";
import { mergeBulkPages } from "$http";
import type { RegionWithSummaries } from "./types.ts";

Deno.test({
  name: "getRegionSummariesBulk pagination/merge boundary",
  permissions: { net: false },
  fn: () => {
    const page1: Array<RegionWithSummaries> = [
      {
        id: "whole-region",
        name: "Whole",
        slug: "whole",
        type: "county",
        boundary: null,
        summaries: [{
          timestamp: "2026-01-01T00:00:00-08:00",
          entry_type: "pm25",
          resolution: "day",
          count: 24,
          expected_count: 24,
          minimum: 1,
          maximum: 2,
          mean: 1.5,
          stddev: 0.1,
          p25: 1,
          p75: 2,
          station_count: 3,
        }],
      },
      {
        id: "split-region",
        name: "Split",
        slug: "split",
        type: "county",
        boundary: null,
        summaries: [{
          timestamp: "2026-01-01T00:00:00-08:00",
          entry_type: "pm25",
          resolution: "day",
          count: 24,
          expected_count: 24,
          minimum: 1,
          maximum: 2,
          mean: 1.5,
          stddev: 0.1,
          p25: 1,
          p75: 2,
          station_count: 3,
        }],
      },
    ];
    const page2: Array<RegionWithSummaries> = [
      {
        id: "split-region",
        name: "Split",
        slug: "split",
        type: "county",
        boundary: null,
        summaries: [{
          timestamp: "2026-01-02T00:00:00-08:00",
          entry_type: "pm25",
          resolution: "day",
          count: 24,
          expected_count: 24,
          minimum: 1,
          maximum: 2,
          mean: 1.6,
          stddev: 0.1,
          p25: 1,
          p75: 2,
          station_count: 3,
        }],
      },
      {
        id: "another-region",
        name: "Another",
        slug: "another",
        type: "county",
        boundary: null,
        summaries: [],
      },
    ];
    const merged = mergeBulkPages([page1, page2]);
    assertEquals(merged.map((r) => r.id), [
      "whole-region",
      "split-region",
      "another-region",
    ]);
    assertEquals(merged[1].summaries.length, 2);
  },
});
