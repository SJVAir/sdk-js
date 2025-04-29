import { assertEquals } from "@std/assert";
import {
  fetchClosestMonitor,
  getClosestMonitorUrl,
  validateClosestMonitorResponse,
} from "./mod.ts";
import { isValidClosestMonitor } from "@sjvair/utils/monitors/validation";
import type { MonitorData } from "@sjvair/utils/types";

const raMonitor: MonitorData = {
  id: "xudEmbncQ7iqwy3sZ0jZvQ",
  name: "CCA Root Access Hackerspace #2",
  device: "PA-II",
  is_active: true,
  is_sjvair: true,
  position: { type: "Point", coordinates: [-119.798676, 36.76274] },
  sensors: ["a", "b"],
  last_active_limit: 3600,
  location: "outside",
  latest: {
    timestamp: "2024-11-20T23:02:11Z",
    sensor: "a",
    celsius: "26.1",
    fahrenheit: "79.0",
    humidity: "13.0",
    pressure: "1005.11",
    pm10: "3.95",
    pm25: "0",
    pm100: "5.77",
    pm25_reported: "5.29",
    pm25_avg_15: "-6.98",
    pm25_avg_60: "0",
    particles_03um: "1679.00",
    particles_05um: "256.00",
    particles_100um: "0.00",
    particles_10um: "24.00",
    particles_25um: "3.00",
    particles_50um: "0.00",
    pm100_standard: null,
    pm10_standard: null,
    pm25_standard: null,
  },
  county: "Fresno",
  data_source: { name: "PurpleAir", url: "https://www2.purpleair.com/" },
  data_providers: [{
    name: "PurpleAir",
    url: "https://www2.purpleair.com/",
  }],
  distance: 0,
  purple_id: 8892,
};

Deno.test({
  name: "Module: Fetch Closest Monitor",
  permissions: { net: true },
  async fn(t) {
    const [longitude, latitude] = raMonitor.position.coordinates;

    await t.step("Build closest monitor url", () => {
      const [longitude, latitude] = raMonitor.position.coordinates;
      const url = getClosestMonitorUrl(latitude, longitude);

      assertEquals(
        url.href,
        "https://www.sjvair.com/api/1.0/monitors/closest/?latitude=36.76274&longitude=-119.798676",
      );
    });

    await t.step("Validate Closest Monitor", async (t) => {
      await t.step("Valid Monitor", () => {
        const isValid = isValidClosestMonitor(raMonitor);
        assertEquals(isValid, true);
      });

      await t.step("Invalid Monitor", () => {
        const invalidMonitor = structuredClone(raMonitor);
        invalidMonitor.latest!.pm25 = "-16";

        const isValid = isValidClosestMonitor(invalidMonitor);

        assertEquals(isValid, false);
      });
    });

    await t.step("Validate Closest Monitor Response", () => {
      const m1 = structuredClone(raMonitor);
      m1.name = "Fake Monitor 1";
      m1.latest!.pm25 = "-16";

      const m2 = structuredClone(raMonitor);
      m2.name = "Fake Monitor 2";
      m2.latest!.pm25 = "9999";

      const m3 = structuredClone(raMonitor);
      m3.name = "Fake Monitor 3";

      const monitor = validateClosestMonitorResponse([m1, m2, m3]);

      assertEquals(monitor.name, "Fake Monitor 3");
    });

    await t.step("Fetch Closest Monitor", async () => {
      const monitor = await fetchClosestMonitor(latitude, longitude);

      assertEquals(monitor.name, "CCA Root Access Hackerspace #2");
    });
  },
});
