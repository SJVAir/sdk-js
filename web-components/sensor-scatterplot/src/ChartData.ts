import { fetchMonitorEntries, MonitorEntryRequestConfig } from "@sjvair/api";
import type { AlignedData } from "uplot";
import type { MonitorEntry, Concrete } from "@sjvair/api";

/** A Monitor entry consisting only the "timestamp", "sensor", and "pm25_reported" fields */
export type ChartMonitorEntry = Concrete<Pick<MonitorEntry, "timestamp" | "sensor" | "pm25_reported">>;

/**
 * Fetch and parse monitor entries for use in the scatter plot
 *
 * @param sensors An array of sensor ID's for which entries will be fetched
 * @param config An object containing the monitor ID and search parameters
 *
 * @returns An array of data sets used by uPlot
 */
export async function fetchChartData(
  sensors: Array<string>,
  config: MonitorEntryRequestConfig
): Promise<AlignedData> {
  const times = new Set<number>();
  const entries = sensors.map(
    sensor => fetchMonitorEntries<ChartMonitorEntry>(Object.assign(config, { sensor }))
  );
  const collections = (await Promise.all(entries))
    .map(collection => collection.reverse()
      .map(entry => {
        const date = new Date(entry.timestamp);

        date.setSeconds(0, 0);
        times.add(Math.floor(date.valueOf() / 1000));

        const value = parseFloat(entry.pm25_reported);

        return isNaN(value) ? null : value;
    }));

  return [Array.from(times), ...collections];
}

