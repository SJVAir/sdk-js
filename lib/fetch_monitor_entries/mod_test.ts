import { fail } from "@std/assert";
import { fetchMonitorEntries } from "./mod.ts";

Deno.test("Fetch Monitor Entries", async () => {
  await fetchMonitorEntries({
    monitorId: "xudEmbncQ7iqwy3sZ0jZvQ",
    fields: "pm25",
  }).catch((err) => {
    console.error(err);
    fail("Monitor entries request failed");
  });
});
