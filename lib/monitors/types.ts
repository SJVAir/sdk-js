// Type utils:
type NullableString = string | null;

/** A Monitor object returned from the SJVAir API */
export interface MonitorData {
  /** County the monitor is located in */
  county: string;

  /** The original source of the monitor data */
  data_source: MonitorDataSource;

  /** The providers which we get monitor data from */
  data_providers: Array<MonitorDataProvider>;

  /** The brand/model of air monitor */
  device: MonitorDevice;

  /** The ID of the monitor */
  id: string;

  /** Indicates whether the monitor is currently reporting data */
  is_active: boolean;

  /** Indicates whether the monitor is owned by SJVAir */
  is_sjvair: boolean;

  /** The length of time a monitor can be offline before being considered inactive */
  last_active_limit: number;

  /** Indicates whether monitor is inside or outside */
  location: string;

  /** The name of the monitor */
  name: string;

  /** The geolocation of the monitor */
  position: MonitorPosition;

  /**
   * The PurpleAir ID of the monitor
   * @remarks This field is only present if the device type is "PurpleAir"
   */
  purple_id?: number;
}

/** The name of the field under which data is stored on a monitor object */
export type MonitorDataField = keyof MonitorLatest;

export interface MonitorDataSource {
  name:
    | "PurpleAir"
    | "AQview"
    | "AirNow.gov"
    | "Central California Asthma Collaborative";
  url: string;
}

export interface MonitorDataProvider {
  name:
    | MonitorDataSource["name"]
    | "AirNow Partners"
    | "California Air Resources Board"
    | "Eastern Kern Air Pollution Control District"
    | "Forest Service"
    | "National Park Service"
    | "San Joaquin Valley APCD"
    | "San Joaquin Valley Unified APCD";
  url?: string;
}

/** The specific brand/model of air monitor */
export type MonitorDevice =
  | "PurpleAir"
  | "BAM 1020"
  | "BAM 1022"
  | "PA-I"
  | "PA-I-LED"
  | "PA-II-FLEX"
  | "PA-II"
  | "PA-II-SD"
  | "UNKNOWN";

export interface MonitorEntryBase {
  sensor: string;
  timestamp: string;
}

export interface MonitorListEntryBase extends MonitorEntryBase {
  timestamp: string;
  sensor: string;
  stage: string;
  processor: string;
}

export interface MonitorListEntry extends MonitorListEntryBase {
  value: string;
}

export interface MonitorListTemperatureEntry extends MonitorListEntryBase {
  temperature_f: string;
  temperature_c: string;
}

export interface MonitorListPressureEntry extends MonitorListEntryBase {
  pressure_mmhg: string;
  pressure_hpa: string;
}

export interface MonitorListParticulatesEntry extends MonitorListEntryBase {
  particles_03um?: string;
  particles_05um?: string;
  particles_10um?: string;
  particles_25um?: string;
  particles_50um?: string;
  particles_100um?: string;
}

export interface MonitorLatestEntry extends MonitorEntryBase {
  value: string;
  calibration: string | null;
}

export interface MonitorLatestParticulatesEntry
  extends Omit<MonitorLatestEntry, "value"> {
  particles_03um?: string;
  particles_05um?: string;
  particles_10um?: string;
  particles_25um?: string;
  particles_50um?: string;
  particles_100um?: string;
}

/** The Geolocation of a monitor */
export interface MonitorPosition {
  /** The longitude and latitude of the monitor */
  coordinates: [number, number];

  /** The type of geometry for this position. Often "Point" */
  type: string;
}

/**
 * The data structure for "latest" field on a MonitorDetails object
 */
export interface MonitorLatest {
  pm10?: MonitorLatestEntry;
  pm25?: MonitorLatestEntry;
  pm100?: MonitorLatestEntry;
  humidity?: MonitorLatestEntry;
  o3?: MonitorLatestEntry;
  pressure?: MonitorLatestEntry;
  temperature?: MonitorLatestEntry;
  particulates?: MonitorLatestParticulatesEntry;
}

export interface MonitorLatestValue<T extends MonitorDataField>
  extends MonitorData {
  latest: MonitorLatest[T];
}

/**
 * The data structure for details on a monitor object
 */
export interface MonitorDetails extends MonitorData {
  latest: MonitorLatest;
}
