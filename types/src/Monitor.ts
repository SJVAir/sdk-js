/** The specific brand/model of air monitor */
export type MonitorDevice = "AirNow" | "BAM1022" | "PurpleAir";

/** The name of the field under which data is stored on a monitor object */
export type MonitorDataFieldName = "pm10" | "pm25" | "pm25_reported" | "pm25_avg_15" | "pm25_avg_60" | "pm100";

/** A Monitor object returned from the SJVAir API */
export interface MonitorData {
  /** County the monitor is located in */
  county: string;

  /** The brand/model of air monitor */
  device: MonitorDevice;

  /**
  * The current distance between a monitor and a given geolocation
  * 
  * @remarks This field is only present when querying the 'monitors/closest'
  * endpoint
  */
  distance?: string;

  /** The ID of the monitor */
  id: string;

  /** Indicates whether the monitor is currently reporting data */
  is_active: boolean;

  /** Indicates whether the monitor is owned by SJVAir */
  is_sjvair: boolean;

  /** The length of time a monitor can be offline before being considered inactive */
  last_active_limit: number;

  /** The latest entry reported by the monitor */
  latest: MonitorEntry;

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
  purple_id: number | null;

  /**
   * A list of sensor ID's the monitor uses
   * @remarks Defaults to an array with one empty string when the monitor
   * only has one reporting sensor
   */
  sensors: Array<string>;
}

/** The Geolocation of a monitor */
export interface MonitorPosition {
  /** The longitude and latitude of the monitor */
  coordinates: [number, number];

  /** The type of geometry for this position. Often "Point" */
  type: string;
}

/** A data entry for a monitor */
export interface MonitorEntry {
  /** The temperature in celsius at the time of reporting */
  celsius?: string;

  /** The temperature in fahrenheit at the time of reporting */
  fahrenheit?: string;

  /** The humidity at the time of reporting */
  humidity?: string;

  /** The ID of the entry */
  id?: string;

  /** PM1.0 value */
  pm10?: string;

  /** Standard PM1.0 value */
  pm10_standard?: string;

  /** PM2.5 value */
  pm25?: string;

  /** 15 minute Average PM2.5 value */
  pm25_avg_15?: string;

  /** 60 minute Average PM2.5 value */
  pm25_avg_60?: string;

  /** The uncalibrated PM2.5 value */
  pm25_reported?: string;

  /** Standard PM2.5 value */
  pm25_standard?: string;

  /** PM10 value */
  pm100?: string;

  /** Standard PM10 value */
  pm100_standard?: string;

  /** 0.3um Particle Count */
  particles_03um?: string;

  /** 0.5um Particle Count */
  particles_05um?: string;

  /** 1.0um Particle Count */
  particles_10um?: string;

  /** 2.5um Particle Count */
  particles_25um?: string;

  /** 5.0um Particle Count */
  particles_50um?: string;

  /** 10.0um Particle Count */
  particles_100um?: string;

  /** The pressure at the time of reporting */
  pressure?: string | null;

  /** The sensor channel the data came from */
  sensor: string;

  /** The moment the data was reported */
  timestamp: string;
}

// External types: These should be moved to TSTK

/**
 * Make all properties in T required
 */
export type Concrete<T> = {
  [P in keyof T]-?: T[P];
};
