// Type utils:
type NullableString = string | null;

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

/** The name of the field under which data is stored on a monitor object */
export type MonitorDataFieldName =
  | "pm10"
  | "pm25"
  | "pm25_avg_15"
  | "pm25_avg_60"
  | "pm100";

export interface MonitorDataSource {
  name:
    | "AirNow.gov"
    | "AirNow Partners"
    | "AQview"
    | "California Air Resources Board"
    | "Central California Asthma Collaborative"
    | "Eastern Kern Air Pollution Control District"
    | "Forest Service"
    | "National Park Service"
    | "PurpleAir"
    | "San Joaquin Valley APCD"
    | "San Joaquin Valley Unified APCD";
  url?: string;
}

export interface MonitorProvider {
  name: string;
  url: string;
}
/** A Monitor object returned from the SJVAir API */
export interface MonitorData {
  /** County the monitor is located in */
  county: string;

  /** The original source of the monitor data */
  data_source: MonitorDataSource;

  /** The providers which we get monitor data from */
  data_providers: Array<MonitorDataSource>;

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

/** A data entry for a monitor */
export interface MonitorEntry {
  /** The temperature in celsius at the time of reporting */
  celsius: NullableString;

  /** The temperature in fahrenheit at the time of reporting */
  fahrenheit: NullableString;

  /** The humidity at the time of reporting */
  humidity: NullableString;

  /** PM1.0 value */
  pm10: NullableString;

  /** Standard PM1.0 value */
  pm10_standard?: NullableString;

  /** PM2.5 value */
  pm25: NullableString;

  /** 15 minute Average PM2.5 value */
  pm25_avg_15: NullableString;

  /** 60 minute Average PM2.5 value */
  pm25_avg_60: NullableString;

  /** The uncalibrated PM2.5 value */
  pm25_reported: NullableString;

  /** Standard PM2.5 value */
  pm25_standard?: NullableString;

  /** PM10 value */
  pm100: NullableString;

  /** Standard PM10 value */
  pm100_standard?: NullableString;

  /** 0.3um Particle Count */
  particles_03um: NullableString;

  /** 0.5um Particle Count */
  particles_05um: NullableString;

  /** 1.0um Particle Count */
  particles_10um: NullableString;

  /** 2.5um Particle Count */
  particles_25um: NullableString;

  /** 5.0um Particle Count */
  particles_50um: NullableString;

  /** 10.0um Particle Count */
  particles_100um: NullableString;

  /** The pressure at the time of reporting */
  pressure: NullableString;

  /** The sensor channel the data came from */
  sensor: string;

  /** The moment the data was reported */
  timestamp: string;
}

/** The Geolocation of a monitor */
export interface MonitorPosition {
  /** The longitude and latitude of the monitor */
  coordinates: [number, number];

  /** The type of geometry for this position. Often "Point" */
  type: string;
}
