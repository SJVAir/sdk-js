import { assert, assertEquals } from "@std/assert";
import { airAlertSchema } from "./schema.ts";

// The shape `account/alerts/` returns since sjvair.com 4c098322 plus the
// `level` field: `sqid` and `level`, and no `id` or `latest`.
const serverAlert = {
  sqid: "u589e",
  created: "2026-10-19T22:00:00.000Z",
  modified: "2026-10-19T22:00:00.000Z",
  monitor: "qesuIWgTQgqtfGJ0rvBBlw",
  entry_type: "pm25",
  start_time: "2026-10-19T22:00:00.000Z",
  end_time: null,
  level: "unhealthy",
};

Deno.test({
  name: "airAlertSchema accepts the current account/alerts/ shape",
  permissions: { net: false },
  fn: () => {
    const result = airAlertSchema.safeParse(serverAlert);
    assert(result.success, result.error?.message);
    assertEquals(result.data.sqid, "u589e");
    assertEquals(result.data.level, "unhealthy");
  },
});

Deno.test({
  name: "airAlertSchema accepts a null level before the first update",
  permissions: { net: false },
  fn: () => {
    const result = airAlertSchema.safeParse({ ...serverAlert, level: null });
    assert(result.success, result.error?.message);
    assertEquals(result.data.level, null);
  },
});

Deno.test({
  name: "airAlertSchema accepts any entry type's level key",
  permissions: { net: false },
  fn: () => {
    const result = airAlertSchema.safeParse({
      ...serverAlert,
      entry_type: "o3",
      level: "unhealthy_sensitive",
    });
    assert(result.success, result.error?.message);
  },
});
