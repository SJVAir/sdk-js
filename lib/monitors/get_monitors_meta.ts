import { jsonCall } from "$http";
import type {
  MonitorEntryType,
  MonitorType,
  SJVAirEntryLevel,
  SJVAirEntryMeta,
  SJVAirMonitorDeviceMeta,
  SJVAirMonitorsMeta,
} from "./types.ts";

class EntriesMeta implements SJVAirEntryMeta {
  /**
   * An iterable representation of the entry level metadata.
   */
  asIter: {
    /**
     * An array of entry level metadata.
     */
    levels: Array<SJVAirEntryLevel>;
  };

  /**
   * Creates an instance of EntriesMeta.
   */
  constructor(private meta: SJVAirEntryMeta) {
    this.asIter = {
      levels: Object.values(this.meta.levels ?? {}),
    };
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
   * The intensity levels associated with this entry type.
   */
  get levels(): Record<string, SJVAirEntryLevel> | null {
    return this.meta.levels;
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
  };

  /**
   * Creates an instance of MonitorsMeta.
   */
  constructor(private meta: SJVAirMonitorsMeta) {
    this.asIter = {
      entries: Object.values(this.meta.entries),
      monitors: Object.values(this.meta.monitors),
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
   * Returns the metadata for a specific monitor entry type.
   *
   * @param entryType - The type of monitor entry to get the metadata for.
   * @returns The metadata for the specified monitor entry type.
   */
  entryType(entryType: MonitorEntryType): EntriesMeta {
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
 * @returns The metadata for monitors and monitor entries.
 */
export async function getMonitorsMeta(): Promise<MonitorsMeta> {
  return new MonitorsMeta(await jsonCall<SJVAirMonitorsMeta>("monitors/meta"));
}
