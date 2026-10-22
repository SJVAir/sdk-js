import { assertEquals, assertThrows } from "@std/assert";
import { apiDateFormat } from "./api_date_format.ts";
import { getValidDateRange } from "./get_valid_date_range.ts";
import {
  addPacificDays,
  endOfPacificDay,
  startOfPacificDay,
} from "./pacific.ts";
import { toApiTimestamp } from "./to_api_timestamp.ts";

Deno.test(
  "Module: API Date Format",
  async (t) => {
    await t.step(
      "API Date Format",
      async (t2) => {
        const expectedResult = "2024-03-17 08:15:24";

        await t2.step("From Date object", () => {
          const date: Date = new Date("03/17/2024 08:15:24");

          assertEquals(apiDateFormat(date), expectedResult);
        });

        await t2.step("From number", () => {
          const date: number = new Date(expectedResult).getTime();

          assertEquals(apiDateFormat(date), expectedResult);
        });

        await t2.step("From string", () => {
          const date: string = "03/17/2024 08:15:24";

          assertEquals(apiDateFormat(date), expectedResult);
        });
      },
    );
  },
);

Deno.test("endOfPacificDay is 23:59:59.999 Pacific in any device zone", () => {
  assertEquals(
    endOfPacificDay(new Date("2026-10-22T12:00:00Z")).toISOString(),
    "2026-10-23T06:59:59.999Z",
  );
  // Late evening Pacific is already the next day in UTC.
  assertEquals(
    endOfPacificDay(new Date("2026-10-23T06:30:00Z")).toISOString(),
    "2026-10-23T06:59:59.999Z",
  );
});

Deno.test("startOfPacificDay across DST end (2026-11-01)", () => {
  assertEquals(
    startOfPacificDay(new Date("2026-11-01T20:00:00Z")).toISOString(),
    "2026-11-01T07:00:00.000Z",
  );
  assertEquals(
    startOfPacificDay(new Date("2026-11-02T20:00:00Z")).toISOString(),
    "2026-11-02T08:00:00.000Z",
  );
});

Deno.test("endOfPacificDay on DST end and start days", () => {
  // 2026-11-01 is 25 hours long; it ends in PST.
  assertEquals(
    endOfPacificDay(new Date("2026-11-01T20:00:00Z")).toISOString(),
    "2026-11-02T07:59:59.999Z",
  );
  // 2026-03-08 is 23 hours long; it starts in PST and ends in PDT.
  assertEquals(
    startOfPacificDay(new Date("2026-03-08T20:00:00Z")).toISOString(),
    "2026-03-08T08:00:00.000Z",
  );
  assertEquals(
    endOfPacificDay(new Date("2026-03-08T20:00:00Z")).toISOString(),
    "2026-03-09T06:59:59.999Z",
  );
});

Deno.test("addPacificDays keeps the Pacific wall-clock time across DST", () => {
  // Noon PDT on Oct 31 -> noon PST on Nov 2.
  assertEquals(
    addPacificDays(new Date("2026-10-31T19:00:00Z"), 2).toISOString(),
    "2026-11-02T20:00:00.000Z",
  );
  // Midnight PST on Nov 2 -> midnight PDT on Oct 30.
  assertEquals(
    addPacificDays(new Date("2026-11-02T08:00:00Z"), -3).toISOString(),
    "2026-10-30T07:00:00.000Z",
  );
  // Month and year rollover.
  assertEquals(
    addPacificDays(new Date("2026-12-31T20:00:00Z"), 1).toISOString(),
    "2027-01-01T20:00:00.000Z",
  );
});

Deno.test("toApiTimestamp sends UTC with Z", () => {
  assertEquals(
    toApiTimestamp(new Date("2026-10-22T07:00:00Z")),
    "2026-10-22T07:00:00.000Z",
  );
  assertEquals(
    toApiTimestamp(Date.UTC(2026, 9, 22, 7)),
    "2026-10-22T07:00:00.000Z",
  );
  assertEquals(
    toApiTimestamp("2026-10-22T00:00:00-07:00"),
    "2026-10-22T07:00:00.000Z",
  );
  assertThrows(
    () => toApiTimestamp("not a date"),
    Error,
    "Invalid date provided",
  );
});

Deno.test("getValidDateRange accepts an end later than now", () => {
  const end = new Date(Date.now() + 6 * 3600_000);
  assertEquals(
    getValidDateRange(undefined, end).lte.getTime() >= end.getTime() - 1,
    true,
  );
});

Deno.test("getValidDateRange snaps days in Pacific time", async (t) => {
  await t.step("default: three Pacific days back to the end of today", () => {
    const now = new Date();
    const range = getValidDateRange();
    assertEquals(range.lte.getTime(), endOfPacificDay(now).getTime());
    assertEquals(
      range.gte.getTime(),
      startOfPacificDay(addPacificDays(range.lte, -3)).getTime(),
    );
  });

  await t.step("start only: ends three Pacific days later", () => {
    const range = getValidDateRange(new Date("2026-10-30T19:00:00Z"));
    assertEquals(range.gte.toISOString(), "2026-10-30T19:00:00.000Z");
    assertEquals(range.lte.toISOString(), "2026-11-03T07:59:59.999Z");
  });

  await t.step(
    "end only: starts at Pacific midnight three days earlier",
    () => {
      const range = getValidDateRange(undefined, "2026-11-02T20:00:00Z");
      assertEquals(range.gte.toISOString(), "2026-10-30T07:00:00.000Z");
      assertEquals(range.lte.toISOString(), "2026-11-02T20:00:00.000Z");
    },
  );

  await t.step("bounds within five minutes span the Pacific day", () => {
    const range = getValidDateRange(
      "2026-10-23T05:00:00Z",
      "2026-10-23T05:03:00Z",
    );
    assertEquals(range.gte.toISOString(), "2026-10-22T07:00:00.000Z");
    assertEquals(range.lte.toISOString(), "2026-10-23T06:59:59.999Z");
  });

  await t.step("reversed bounds are sorted", () => {
    const range = getValidDateRange(
      "2026-10-23T00:00:00Z",
      "2026-10-20T00:00:00Z",
    );
    assertEquals(range.gte.toISOString(), "2026-10-20T00:00:00.000Z");
    assertEquals(range.lte.toISOString(), "2026-10-23T00:00:00.000Z");
  });

  await t.step("does not mutate Date arguments", () => {
    const start = new Date("2026-10-23T05:00:00Z");
    const end = new Date("2026-10-23T05:03:00Z");
    getValidDateRange(start, end);
    assertEquals(start.toISOString(), "2026-10-23T05:00:00.000Z");
    assertEquals(end.toISOString(), "2026-10-23T05:03:00.000Z");
  });

  await t.step("rejects an unparseable bound", () => {
    assertThrows(() => getValidDateRange("nope"), Error, "cannot be used");
  });
});
