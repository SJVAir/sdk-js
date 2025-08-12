import * as z from "zod";
import {
  monitorEntrySchema,
  monitorParticulatesEntrySchema,
  monitorPressureEntrySchema,
  monitorTemperatureEntrySchema,
} from "./monitor_entry.ts";

export const monitorDataVendorSchema = z.object({
  /** The name of the data vendor */
  name: z.string(),

  /** The url of the data vendor's website */
  url: z.optional(z.string()),
});

export const monitorHealthSchema = z.object({
  /** The timestamp of the health check */
  hour: z.string(),

  /** The number representation of the monitor's health */
  score: z.number(),

  /** FIXME: Some stat */
  rpd_pairwise: z.nullable(z.number()),

  /** FIXME: Some stat */
  correlation: z.nullable(z.number()),

  /** States whether or not the sensor is returning valid data */
  channel_a_sanity: z.boolean(),

  /** States whether or not the sensor is returning valid data */
  channel_b_sanity: z.boolean(),

  /** The letter representation of the monitor's health */
  grade: z.string(),
});

export const monitorPositionSchema = z.object({
  /** The point coordinates of a monitor */
  coordinates: z.array(z.number()).length(2),

  /** The type of GeoJSON object returned */
  type: z.string(),
});

//** The group a monitor belongs to */
export const monitorTypeSchema = z.enum(
  ["airgradient", "airnow", "aqview", "bam1022", "purpleair"] as const,
);

export const monitorDataSchema = z.object({
  /** County the monitor is located in */
  county: z.string(),

  /** The original source of the monitor data */
  data_source: monitorDataVendorSchema,

  /** The providers which we get monitor data from */
  data_providers: z.array(monitorDataVendorSchema),

  /** The brand/model of air monitor */
  device: z.string(),

  /** Indicates whether or not the monitor has dual sensors */
  dual_channel: z.optional(z.boolean()),

  /** The current health of the monitor */
  health: z.optional(monitorHealthSchema),

  /** The ID of the monitor */
  id: z.string(),

  /** Indicates whether the monitor is currently reporting data */
  is_active: z.boolean(),

  /** Indicates whether the monitor is owned by SJVAir */
  is_sjvair: z.boolean(),

  /** The length of time a monitor can be offline before being considered inactive */
  last_active_limit: z.number(),

  /** Indicates whether monitor is inside or outside */
  location: z.string(),

  /** The ID of the location of an AirGradient monitor */
  location_id: z.optional(z.number()),

  /** The name of the monitor */
  name: z.string(),

  /** The geolocation of the monitor */
  position: z.nullable(monitorPositionSchema),

  /**
   * The specific type of a monitor.
   * This corresponds to the class name of the model used on the server
   */
  type: monitorTypeSchema,

  /**
   * The PurpleAir ID of the monitor
   * @remarks This field is only present if the device type is "PurpleAir"
   */
  purple_id: z.optional(z.number()),
});

export const monitorLatestSchema = monitorDataSchema.extend({
  /** The latest specified entry for a given monitor */
  latest: z.union([
    monitorEntrySchema,
    monitorTemperatureEntrySchema,
    monitorPressureEntrySchema,
    monitorParticulatesEntrySchema,
  ]),
});

export const monitorClosestSchema = monitorLatestSchema.extend({
  /** The distance the monitor is from the provided Point */
  distance: z.number(),
});

export const monitorDetailsSchema = monitorDataSchema.extend({
  latest: {
    /** The latest entry for the pm10 field */
    pm10: z.optional(monitorEntrySchema),

    /** The latest entry for the pm25 field */
    pm25: z.optional(monitorEntrySchema),

    /** The latest entry for the pm100 field */
    pm100: z.optional(monitorEntrySchema),

    /** The latest entry for the humidity field */
    humidity: z.optional(monitorEntrySchema),

    /** The latest entry for the o3 (ozone) field */
    o3: z.optional(monitorEntrySchema),

    /** The latest entry for the no2 (nitrogen dioxide) field */
    no2: z.optional(monitorEntrySchema),

    /** The latest entry for the pressure field */
    pressure: z.optional(monitorEntrySchema),

    /** The latest entry for the temperature field */
    temperature: z.optional(monitorEntrySchema),

    /** The latest entry for the particulates field */
    particulates: z.optional(monitorParticulatesEntrySchema),
  },
});

export const collocationSchema = z.object({
  id: z.string(),
  reference_id: z.string(),
  colocated_id: z.string(),
  name: z.string(),
  position: monitorPositionSchema,
});
