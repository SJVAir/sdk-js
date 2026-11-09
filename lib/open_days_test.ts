import { assertEquals } from "@std/assert";
import { mergeBulkOpenDays, mergeOpenDays } from "./open_days.ts";

type Row = { timestamp: string; v: number };
type Owner = { id: string; name: string; summaries: Array<Row> };

const day = (d: number, v: number): Row => ({
  timestamp: `2026-11-${String(d).padStart(2, "0")}T00:00:00-08:00`,
  v,
});
const owner = (id: string, summaries: Array<Row>, name = id): Owner => ({
  id,
  name,
  summaries,
});

Deno.test("stored wins on a shared day", () => {
  assertEquals(
    mergeOpenDays([day(8, 1)], [day(8, 2), day(9, 3)]),
    [day(8, 1), day(9, 3)],
  );
});

Deno.test("open-only days are added and sorted", () => {
  assertEquals(
    mergeOpenDays([day(7, 1), day(8, 2)], [day(9, 3)]),
    [day(7, 1), day(8, 2), day(9, 3)],
  );
  assertEquals(
    mergeOpenDays([day(8, 2)], [day(9, 3), day(7, 1)]),
    [day(7, 1), day(8, 2), day(9, 3)],
  );
});

Deno.test("sorts by instant across an offset change", () => {
  const nov1 = { timestamp: "2026-11-01T00:00:00-07:00", v: 1 };
  const nov2 = { timestamp: "2026-11-02T00:00:00-08:00", v: 2 };
  const oct31 = { timestamp: "2026-10-31T00:00:00-07:00", v: 0 };
  assertEquals(mergeOpenDays([nov2, nov1], [oct31]), [oct31, nov1, nov2]);
});

Deno.test("a day repeated in open is kept once, first wins", () => {
  assertEquals(mergeOpenDays([], [day(9, 1), day(9, 2)]), [day(9, 1)]);
});

Deno.test("empty inputs", () => {
  assertEquals(mergeOpenDays([], []), []);
  assertEquals(mergeOpenDays([day(8, 1)], []), [day(8, 1)]);
  assertEquals(mergeOpenDays([], [day(9, 2), day(8, 1)]), [
    day(8, 1),
    day(9, 2),
  ]);
});

Deno.test("inputs not mutated", () => {
  const stored = [day(8, 1), day(7, 0)];
  const open = [day(9, 2), day(8, 5)];
  const storedCopy = structuredClone(stored);
  const openCopy = structuredClone(open);
  mergeOpenDays(stored, open);
  assertEquals(stored, storedCopy);
  assertEquals(open, openCopy);
});

Deno.test("bulk: owner in both merges its rows", () => {
  assertEquals(
    mergeBulkOpenDays(
      [owner("a", [day(7, 1), day(8, 2)])],
      [owner("a", [day(8, 9), day(9, 3)])],
    ),
    [owner("a", [day(7, 1), day(8, 2), day(9, 3)])],
  );
});

Deno.test("bulk: stored-only owner kept", () => {
  assertEquals(
    mergeBulkOpenDays([owner("a", [day(8, 1)])], []),
    [owner("a", [day(8, 1)])],
  );
});

Deno.test("bulk: open-only owner appended after stored owners", () => {
  assertEquals(
    mergeBulkOpenDays(
      [owner("b", [day(8, 1)]), owner("c", [day(8, 2)])],
      [owner("a", [day(9, 3)]), owner("c", [day(9, 4)])],
    ),
    [
      owner("b", [day(8, 1)]),
      owner("c", [day(8, 2), day(9, 4)]),
      owner("a", [day(9, 3)]),
    ],
  );
});

Deno.test("bulk: owner with summaries: [] in open keeps stored rows", () => {
  assertEquals(
    mergeBulkOpenDays([owner("a", [day(8, 1)])], [owner("a", [])]),
    [owner("a", [day(8, 1)])],
  );
});

Deno.test("bulk: stored owner's fields win", () => {
  assertEquals(
    mergeBulkOpenDays([owner("a", [], "stored")], [owner("a", [], "open")]),
    [owner("a", [], "stored")],
  );
});

Deno.test(
  "bulk: duplicate ids in open folded, first entry's fields, no repeated day",
  () => {
    assertEquals(
      mergeBulkOpenDays([], [
        owner("a", [day(8, 1), day(9, 1)], "first"),
        owner("b", [day(9, 5)]),
        owner("a", [day(9, 2), day(10, 3)], "second"),
      ]),
      [
        owner("a", [day(8, 1), day(9, 1), day(10, 3)], "first"),
        owner("b", [day(9, 5)]),
      ],
    );
  },
);

Deno.test("bulk: stored summaries arrays not mutated", () => {
  const stored = [owner("a", [day(8, 1)])];
  const open = [owner("a", [day(9, 2)]), owner("b", [day(9, 3)])];
  const storedCopy = structuredClone(stored);
  const openCopy = structuredClone(open);
  const merged = mergeBulkOpenDays(stored, open);
  assertEquals(stored, storedCopy);
  assertEquals(open, openCopy);
  merged[0].summaries.push(day(10, 4));
  assertEquals(stored, storedCopy);
});

Deno.test("bulk: a stored-only owner's rows come back sorted", () => {
  assertEquals(
    mergeBulkOpenDays([owner("a", [day(9, 2), day(8, 1)])], []),
    [owner("a", [day(8, 1), day(9, 2)])],
  );
});
