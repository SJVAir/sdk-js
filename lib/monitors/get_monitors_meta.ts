/**
 * A utility function for fetching the metadata for the /monitors/ API endpoints.
 *
 * @example Usage
 * ```ts
 * import { getMonitorsMeta } from "@sjvair/sdk/monitors/get_monitors_meta";
 *
 * const meta = await getMonitorsMeta();
 * console.log(meta);
 * // Prints:
 * //  {
 * //    "default_pollutant": "pm25",
 * //    "available_pollutants": ["o3", "pm25"],
 * //    "monitor_groups": {
 * //      "reference": { "key": "reference", "label": "Reference-grade", "order": 0 },
 * //      "low-cost": { "key": "low-cost", "label": "Low-cost sensors", "order": 1 },
 * //    },
 * //    "monitors": {
 * //      "airgradient": {
 * //        "label": "AirGradient",
 * //        "type": "airgradient",
 * //        "group": "low-cost",
 * //        "expected_interval": "1 min",
 * //        "entries": {
 * //          "humidity": {
 * //            "sensors": [
 * //              "1",
 * //              "2",
 * //            ],
 * //            "published": false,
 * //            "allowed_stages": [
 * //              "raw",
 * //              "calibrated",
 * //            ],
 * //            "default_stage": "raw",
 * //            "default_calibration": "AirGradientHumidity",
 * //            "processors": {
 * //              "raw": [
 * //                "AirGradientHumidity",
 * //              ],
 * //            },
 * //            "alerts": null,
 * //          },
 * //          ... (other entry types omitted for brevity)
 * //        },
 * //      },
 * //      ... (other monitor types omitted for brevity)
 * //    },
 * //    "entries": {
 * //      "pm25": {
 * //        "label": "PM2.5",
 * //        "type": "pm25",
 * //        "description": "Fine particles from smoke, dust, and vehicle exhaust.",
 * //        "units": "µg/m³",
 * //        "epa_aqs_code": 88101,
 * //        "fields": [
 * //          "timestamp",
 * //          "sensor",
 * //          "stage",
 * //          "processor",
 * //          "value",
 * //        ],
 * //        "scale": {
 * //          "id": "pm25",
 * //          "label": "PM2.5",
 * //          "averaging_hours": 24,
 * //          "daily_statistic": "mean_24h",
 * //          "daily_statistic_label": "24-hour average",
 * //          "levels": [
 * //            { "key": "good", "label": "Good", "color": "#00e400", "min": 0, ... },
 * //            ... (other levels omitted for brevity)
 * //          ],
 * //          ... (other scale fields omitted for brevity)
 * //        },
 * //        "school_guidelines": {
 * //          "label": "Outdoor Activity Guidelines for Schools",
 * //          "resolution": "hour",
 * //          "activities": [
 * //            {
 * //              "key": "recess",
 * //              "label": "Recess",
 * //              "duration": "15 minutes",
 * //              "levels": { "good": ["No restrictions."], ... },
 * //            },
 * //            ... (other activities omitted for brevity)
 * //          ],
 * //        },
 * //      },
 * //      ... (other entry types omitted for brevity)
 * //    }
 * //  }
 * ```
 *
 * @module
 */
import type { Choice, Scale } from "../meta/types.ts";
import { jsonCall, type RequestOptions } from "$http";
import type {
  MonitorEntryType,
  MonitorGroup,
  MonitorType,
  SchoolGuidelines,
  SJVAirEntryMeta,
  SJVAirMonitorDeviceMeta,
  SJVAirMonitorsMeta,
} from "./types.ts";

class EntriesMeta implements SJVAirEntryMeta {
  /**
   * Creates an instance of EntriesMeta.
   */
  constructor(private meta: SJVAirEntryMeta) {}

  /**
   * Short plain help text for this entry type, or null when it has none
   * (weather entry types and particulates).
   */
  get description(): string | null {
    return this.meta.description;
  }

  /**
   * The EPA AQS code associated with this entry type.
   */
  get epa_aqs_code(): number | null {
    return this.meta.epa_aqs_code;
  }

  /**
   * The data fields available with this entry type.
   */
  get fields(): Array<string> {
    return this.meta.fields;
  }

  /**
   * The human-readable label for this entry type.
   */
  get label(): string {
    return this.meta.label;
  }

  /**
   * The scale that turns this entry type's value into a level, or null when
   * it has none.
   */
  get scale(): Scale | null {
    return this.meta.scale;
  }

  /**
   * The outdoor activity guidelines for schools, or null when this entry type
   * has none (only PM2.5 has them). Each activity's `levels` is keyed by the
   * scale's level keys, and the guidelines apply to hourly values.
   */
  get school_guidelines(): SchoolGuidelines | null {
    return this.meta.school_guidelines;
  }

  /**
   * The type of monitor entry (e.g., "pm25", "o3", etc.).
   */
  get type(): string {
    return this.meta.type;
  }

  /**
   * The symbol(s) used to represent the unit of measurement for this entry type.
   */
  get units(): string | null {
    return this.meta.units;
  }
}

export class MonitorsMeta implements SJVAirMonitorsMeta {
  /**
   * An iterable representation of the monitor metadata.
   */
  asIter: {
    /**
     * An array of monitor entry metadata.
     */
    entries: Array<SJVAirEntryMeta>;

    /**
     * An array of monitor metadata.
     */
    monitors: Array<SJVAirMonitorDeviceMeta>;

    /**
     * An array of the monitor groups, sorted by `order`.
     */
    monitor_groups: Array<MonitorGroup>;

    /**
     * An array of the documented data stages.
     */
    stages: Array<Choice>;

    /**
     * An array of the documented processors.
     */
    processors: Array<Choice>;
  };

  /**
   * Creates an instance of MonitorsMeta.
   */
  constructor(private meta: SJVAirMonitorsMeta) {
    this.asIter = {
      entries: Object.values(this.meta.entries),
      monitors: Object.values(this.meta.monitors),
      monitor_groups: Object.values(this.meta.monitor_groups).sort((a, b) =>
        a.order - b.order
      ),
      stages: Object.values(this.meta.stages),
      processors: Object.values(this.meta.processors),
    };
  }

  /**
   * Returns the default pollutant for monitors.
   *
   * @returns The default pollutant for monitors.
   */
  get default_pollutant(): SJVAirMonitorsMeta["default_pollutant"] {
    return this.meta.default_pollutant;
  }

  /**
   * Returns the entry types published on the map, such as "pm25" and "o3".
   *
   * @returns The ids of the available pollutants.
   */
  get available_pollutants(): Array<string> {
    return this.meta.available_pollutants;
  }

  /**
   * Returns a record of all monitor entry metadata.
   *
   * @returns A record of all monitor entry metadata.
   */
  get entries(): Record<string, SJVAirEntryMeta> {
    return this.meta.entries;
  }

  /**
   * Returns an record of all monitor metadata.
   *
   * @returns A record of all monitor metadata.
   */
  get monitors(): Record<string, SJVAirMonitorDeviceMeta> {
    return this.meta.monitors;
  }

  /**
   * Returns the groups monitor types are listed under, by id. Each monitor
   * type's `group` is one of these keys, or null.
   *
   * @returns A record of monitor groups.
   */
  get monitor_groups(): Record<string, MonitorGroup> {
    return this.meta.monitor_groups;
  }

  /**
   * Returns the documented data stages by key.
   *
   * @returns A record of stages.
   */
  get stages(): Record<string, Choice> {
    return this.meta.stages;
  }

  /**
   * Returns the documented processors by key.
   *
   * @returns A record of processors.
   */
  get processors(): Record<string, Choice> {
    return this.meta.processors;
  }

  /**
   * Returns the metadata for a specific monitor entry type.
   *
   * @param entryType - The type of monitor entry to get the metadata for.
   * @returns The metadata for the specified monitor entry type.
   */
  entryType(entryType: MonitorEntryType): EntriesMeta {
    if (!(entryType in this.meta.entries)) {
      throw new Error(`Invalid entry type: ${entryType}`);
    }

    const entryMeta = this.asIter.entries.find((entryMeta) =>
      entryMeta.type === entryType
    )!;

    return new EntriesMeta(entryMeta);
  }

  /**
   * Returns the metadata for a specific monitor type.
   *
   * @param monitorType - The type of monitor to get the metadata for.
   * @returns The metadata for the specified monitor type.
   */
  monitorType(monitorType: MonitorType): SJVAirMonitorDeviceMeta {
    return this.asIter.monitors.find((monitorMeta) =>
      monitorMeta.type === monitorType
    )!;
  }
}

/**
 * Fetches the metadata for monitors and monitor entries.
 *
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The metadata for monitors and monitor entries.
 */
export async function getMonitorsMeta(
  options?: RequestOptions,
): Promise<MonitorsMeta> {
  return new MonitorsMeta(
    await jsonCall<SJVAirMonitorsMeta>({ url: "monitors/meta", options }),
  );
}
