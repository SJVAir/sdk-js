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
  asIter: {
    levels: Array<SJVAirEntryLevel>;
  };

  constructor(private meta: SJVAirEntryMeta) {
    this.asIter = {
      levels: Object.values(this.meta.levels ?? {}),
    };
  }

  get epa_aqs_code() {
    return this.meta.epa_aqs_code;
  }

  get fields() {
    return this.meta.fields;
  }

  get label() {
    return this.meta.label;
  }

  get levels() {
    return this.meta.levels;
  }

  get type() {
    return this.meta.type;
  }

  get units() {
    return this.meta.units;
  }
}

export class MonitorsMeta implements SJVAirMonitorsMeta {
  asIter: {
    entries: Array<SJVAirEntryMeta>;
    monitors: Array<SJVAirMonitorDeviceMeta>;
  };

  constructor(private meta: SJVAirMonitorsMeta) {
    this.asIter = {
      entries: Object.values(this.meta.entries),
      monitors: Object.values(this.meta.monitors),
    };
  }

  get default_pollutant() {
    return this.meta.default_pollutant;
  }

  get entries() {
    return this.meta.entries;
  }

  get monitors() {
    return this.meta.monitors;
  }

  entryType(entryType: MonitorEntryType) {
    const entryMeta = this.asIter.entries.find((entryMeta) =>
      entryMeta.type === entryType
    )!;
    return new EntriesMeta(entryMeta);
  }
  monitorType(monitorType: MonitorType) {
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
