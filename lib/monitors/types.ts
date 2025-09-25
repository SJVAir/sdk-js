/**
 * Types for the Monitor and Monitor Entry data structures.
 * @module
 */
import type { infer as zinfer } from "zod";
import type {
  monitorClosestSchema,
  monitorDataSchema,
  monitorDataVendorSchema,
  monitorDetailsSchema,
  monitorEntryMetaSchema,
  monitorEntrySchema,
  monitorEntryTypeSchema,
  monitorHealthSchema,
  monitorLatestSchema,
  monitorParticulatesEntrySchema,
  monitorPressureEntrySchema,
  monitorTemperatureEntrySchema,
  monitorTypeSchema,
  sjvairEntryLevelMetaSchema,
  sjvairEntryMetaSchema,
  sjvairMonitorDeviceMetaSchema,
  sjvairMonitorEntryMetaSchema,
  sjvairMonitorsMetaSchema,
} from "./schemas/mod.ts";

/** A Monitor object returned from the SJVAir API */
export type MonitorData = zinfer<typeof monitorDataSchema>;

/**
 * The specific type of a monitor.
 */
export type MonitorType = zinfer<typeof monitorTypeSchema>;

/** A data source or provider */
export type MonitorDataVendor = zinfer<typeof monitorDataVendorSchema>;

/** The data structure for a monitor's health report */
export type MonitorHealth = zinfer<typeof monitorHealthSchema>;

/** The Type of Entry for a given monitor */
export type MonitorEntryType = zinfer<typeof monitorEntryTypeSchema>;

/**
 * The metadata found on all monitor entries
 */
export type MonitorEntryMeta = zinfer<typeof monitorEntryMetaSchema>;

/**
 * An entry type with a singular value
 */
export type MonitorEntry = zinfer<typeof monitorEntrySchema>;

/**
 * The Entry type for temperature values
 */
export type MonitorTemperatureEntry = zinfer<
  typeof monitorTemperatureEntrySchema
>;

/**
 * The Entry type for pressure values
 */
export type MonitorPressureEntry = zinfer<typeof monitorPressureEntrySchema>;

/**
 * The Entry type for particulates entry lists
 */
export type MonitorParticulatesEntry = zinfer<
  typeof monitorParticulatesEntrySchema
>;

/** A utility type for defining the lookup table */
interface ExplicitMonitorEntry<T extends MonitorEntryType>
  extends Omit<MonitorEntry, "entry_type"> {
  entry_type: T;
}
/**
 * A lookup table for entry types
 */
export interface MonitorEntries {
  pm10: ExplicitMonitorEntry<"pm10">;
  pm25: ExplicitMonitorEntry<"pm25">;
  pm100: ExplicitMonitorEntry<"pm100">;
  humidity: ExplicitMonitorEntry<"humidity">;
  o3: ExplicitMonitorEntry<"o3">;
  no2: ExplicitMonitorEntry<"no2">;
  pressure: MonitorPressureEntry;
  temperature: MonitorTemperatureEntry;
  particulates: MonitorParticulatesEntry;
}

/**
 * A utility type to leverage the MonitorEntries lookup table
 */
export type MonitorEntriesMap<T extends keyof MonitorEntries> =
  MonitorEntries[T];

/**
 * The monitor data structure for the latest value of a specific
 * entry type
 */
export type MonitorLatest = zinfer<typeof monitorLatestSchema>;

/**
 * The monitor data structure for the monitor with a specific
 * latest entry type
 */
export interface MonitorLatestType<T extends keyof MonitorEntries>
  extends Omit<MonitorLatest, "latest"> {
  latest: MonitorEntries[T];
}

/**
 * The monitor data structure for the closest monitor
 */
export type MonitorClosest = zinfer<typeof monitorClosestSchema>;

/**
 * The monitor data structure for the closest monitor with a
 * specific latest entry type
 */
export interface MonitorClosestType<T extends keyof MonitorEntries>
  extends Omit<MonitorClosest, "latest"> {
  latest: MonitorEntries[T];
}
/** The data structure for details on a monitor object */
export type MonitorDetails = zinfer<typeof monitorDetailsSchema>;

/** The metadata about the included entry types for a given monitor type  */
export type SJVAirMonitorEntryMeta = zinfer<
  typeof sjvairMonitorEntryMetaSchema
>;

/** The metadata about a given monitor type */
export type SJVAirMonitorDeviceMeta = zinfer<
  typeof sjvairMonitorDeviceMetaSchema
>;

/**
 * The metadata about the breakpoints used to determine the severity of a
 * specific entry type of a given monitor type
 */
export type SJVAirEntryLevel = zinfer<typeof sjvairEntryLevelMetaSchema>;

/** The metadata about the types of monitor entries */
export type SJVAirEntryMeta = zinfer<typeof sjvairEntryMetaSchema>;

/** The metadata returned from monitors/meta */
export type SJVAirMonitorsMeta = zinfer<typeof sjvairMonitorsMetaSchema>;
