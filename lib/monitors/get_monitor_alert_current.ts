/**
 * A utility function for getting a monitor's current alert values: the
 * trailing average and level that SMS alerts use.
 *
 * @example Usage
 * ```ts
 * import { getMonitorAlertCurrent } from "@sjvair/sdk/monitors/get_monitor_alert_current";
 *
 * const current = await getMonitorAlertCurrent("xgXCRh68SdG5FOdbUXvR6Q");
 * console.log(current);
 * // Prints:
 * //  {
 * //    "pm25": {
 * //      "status": "ok",
 * //      "value": 12.4,
 * //      "level": "moderate",
 * //      "window": {
 * //        "start": "2026-11-08T15:00:04-08:00",
 * //        "end": "2026-11-08T16:00:04-08:00"
 * //      },
 * //      "latest_timestamp": "2026-11-08T15:58:00-08:00",
 * //      "readings": 29,
 * //      "required": 15,
 * //      "previous": { "status": "insufficient", "value": null, "level": null },
 * //      "evaluated_at": "2026-11-08T16:00:04-08:00"
 * //    }
 * //  }
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import type { MonitorAlertCurrentRecord } from "./types.ts";

/**
 * The data structure returned from the "/monitors/{ MONITOR_ID }/alerts/current/" endpoint
 */
export type MonitorAlertCurrentResponse = { data: MonitorAlertCurrentRecord };

/**
 * Fetch a monitor's current alert result for each evaluated entry type.
 * A missing key means that entry type isn't evaluated; the record can be empty.
 *
 * @param monitorId The ID of the requested monitor
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns A record keyed by entry type id
 */
export async function getMonitorAlertCurrent(
  monitorId: string,
  options?: RequestOptions,
): Promise<MonitorAlertCurrentRecord> {
  return await jsonCall<MonitorAlertCurrentRecord>({
    url: `monitors/${monitorId}/alerts/current`,
    options,
  });
}
