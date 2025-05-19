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
   * The specific type of a monitor.
   * This corresponds to the class name of the model used on the server
   */
  type: MonitorType;

  /**
   * The PurpleAir ID of the monitor
   * @remarks This field is only present if the device type is "PurpleAir"
   */
  purple_id?: number;
}

/**
 * The specific type of a monitor.
 * This corresponds to the class name of the model used on the server
 */
export type MonitorType =
  | "airgradient"
  | "airnow"
  | "aqview"
  | "bam"
  | "methane"
  | "purpleair";

/** The name of the field under which data is stored on a monitor object */
export type MonitorDataField = keyof MonitorEntries;

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

export type MonitorEntryType =
  | "pm10"
  | "pm25"
  | "pm100"
  | "humidity"
  | "o3"
  | "no2"
  | "pressure"
  | "temperature"
  | "particulates";

/** The Geolocation of a monitor */
export interface MonitorPosition {
  /** The longitude and latitude of the monitor */
  coordinates: [number, number];

  /** The type of geometry for this position. Often "Point" */
  type: string;
}

/**
 * The data fields for all Particulates entries
 */
export interface MonitorParticulatesValues {
  particles_03um?: string;
  particles_05um?: string;
  particles_10um?: string;
  particles_25um?: string;
  particles_50um?: string;
  particles_100um?: string;
}

/**
 * The metadata found on all monitor entries
 */
export interface MonitorEntryMeta {
  timestamp: string;
  sensor: string;
  stage: string;
  processor: string;
  entry_type: MonitorEntryType;
}

/**
 * An entry type with a singular value
 */
export interface MonitorEntry extends MonitorEntryMeta {
  value: string;
}

/**
 * The Entry type for temperature values
 */
export interface MonitorTemperatureEntry extends MonitorEntryMeta {
  temperature_f: string;
  temperature_c: string;
}

/**
 * The Entry type for pressure values
 */
export interface MonitorPressureEntry extends MonitorEntryMeta {
  pressure_mmhg: string;
  pressure_hpa: string;
}

/**
 * The Entry type for particulates entry lists
 */
export type MonitorParticulatesEntry =
  & MonitorEntryMeta
  & MonitorParticulatesValues;

export interface MonitorEntries {
  pm10?: MonitorEntry;
  pm25?: MonitorEntry;
  pm100?: MonitorEntry;
  humidity?: MonitorEntry;
  o3?: MonitorEntry;
  no2?: MonitorEntry;
  pressure?: MonitorPressureEntry;
  temperature?: MonitorTemperatureEntry;
  particulates?: MonitorParticulatesEntry;
}

/**
 * The monitor data structure for the latest value of a specific entry type
 */
export interface MonitorLatest<T extends MonitorDataField> extends MonitorData {
  latest: MonitorEntries[T];
}

/**
 * The data structure for "latest" field on a MonitorDetails object
 */
export interface MonitorDetailsEntries {
  pm10?: MonitorEntry;
  pm25?: MonitorEntry;
  pm100?: MonitorEntry;
  humidity?: MonitorEntry;
  o3?: MonitorEntry;
  no2?: MonitorEntry;
  pressure?: MonitorEntry;
  temperature?: MonitorEntry;
  particulates?: MonitorParticulatesEntry;
}

/**
 * The data structure for details on a monitor object
 */
export interface MonitorDetails extends MonitorData {
  latest: MonitorDetailsEntries;
}

/**
 * The data structure a paginated response from the server
 */
export interface PaginatedResponse<T> {
  /** The monitor entries included in the current page of results */
  data: Array<T>;

  /** The current page of results fetched */
  page: number;

  /** The total count of results */
  count: number;

  /** The total amount of results pages */
  pages: number;

  /** Indicates whether there is a next page of results */
  has_next_page: boolean;

  /** Indicates wether there is a previous page of results */
  has_previous_page: boolean;
}
