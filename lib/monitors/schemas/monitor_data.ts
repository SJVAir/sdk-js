import * as z from "zod";
import {
  type MonitorDataVendorSchema,
  monitorDataVendorSchema,
} from "./monitor_data_vendor.ts";
import {
  type MonitorEntrySchema,
  monitorEntrySchema,
  type MonitorParticulatesEntrySchema,
  monitorParticulatesEntrySchema,
  type SomeMonitorEntrySchema,
  someMonitorEntrySchema,
} from "./monitor_entry.ts";
import {
  type MonitorHealthSchema,
  monitorHealthSchema,
} from "./monitor_health.ts";
import { type MonitorTypeSchema, monitorTypeSchema } from "./monitor_type.ts";
import { type GeoJSONPointSchema, geoJSONPointSchema } from "../../schema.ts";

interface MonitorDataSchema extends
  z.ZodObject<{
    /** County the monitor is located in */
    county: z.ZodString;

    /** The original source of the monitor data */
    data_source: MonitorDataVendorSchema;

    /** The providers which we get monitor data from */
    //data_providers: z.array(monitorDataVendorSchema),
    data_providers: z.ZodArray<MonitorDataVendorSchema>;

    /** The brand/model of air monitor */
    device: z.ZodString;

    /** Indicates whether or not the monitor has dual sensors */
    dual_channel: z.ZodOptional<z.ZodBoolean>;

    /** The current health of the monitor */
    health: z.ZodOptional<MonitorHealthSchema>;

    /** The ID of the monitor */
    id: z.ZodString;

    /** Indicates whether the monitor is currently reporting data */
    is_active: z.ZodBoolean;

    /** Indicates whether the monitor is owned by SJVAir */
    is_sjvair: z.ZodBoolean;

    /** The length of time a monitor can be offline before being considered inactive */
    last_active_limit: z.ZodNumber;

    /** Indicates whether monitor is inside or outside */
    location: z.ZodString;

    /** The ID of the location of an AirGradient monitor */
    location_id: z.ZodOptional<z.ZodNumber>;

    /** The name of the monitor */
    name: z.ZodString;

    /** The geolocation of the monitor */
    position: z.ZodNullable<GeoJSONPointSchema>;

    /**
     * The specific type of a monitor.
     * This corresponds to the class name of the model used on the server
     */
    type: MonitorTypeSchema;

    /**
     * The PurpleAir ID of the monitor
     * @remarks This field is only present if the device type is "PurpleAir"
     */
    purple_id: z.ZodOptional<z.ZodNumber>;
  }> {}

export const monitorDataSchema: MonitorDataSchema = z.object({
  county: z.string(),
  data_source: monitorDataVendorSchema,
  data_providers: z.array(monitorDataVendorSchema),
  device: z.string(),
  dual_channel: z.optional(z.boolean()),
  health: z.optional(monitorHealthSchema),
  id: z.string(),
  is_active: z.boolean(),
  is_sjvair: z.boolean(),
  last_active_limit: z.number(),
  location: z.string(),
  location_id: z.optional(z.number()),
  name: z.string(),
  position: z.nullable(geoJSONPointSchema),
  type: monitorTypeSchema,
  purple_id: z.optional(z.number()),
});

export interface MonitorLatestSchema extends
  z.ZodObject<
    MonitorDataSchema["shape"] & {
      /** The latest specified entry for a given monitor */
      latest: SomeMonitorEntrySchema;
    }
  > {}

export const monitorLatestSchema: MonitorLatestSchema = monitorDataSchema
  .extend({ latest: someMonitorEntrySchema });

export interface MonitorClosestSchema extends
  z.ZodObject<
    MonitorLatestSchema["shape"] & {
      /** The distance the monitor is from the provided Point */
      distance: z.ZodNumber;
    }
  > {}

export const monitorClosestSchema: MonitorClosestSchema = monitorLatestSchema
  .extend({
    /** The distance the monitor is from the provided Point */
    distance: z.number(),
  });

interface DetailsEntrySchema extends
  z.ZodObject<
    Omit<MonitorEntrySchema["shape"], "entry_type">
  > {}

/** A utility schema for defining the monitorDetailsSchema */
const detailsEntrySchema: DetailsEntrySchema = monitorEntrySchema.omit({
  entry_type: true,
});

//export interface MonitorDetailsSchema extends
//  z.ZodObject<
//    MonitorDataSchema["shape"] & {
//      latest: {
//        /** The latest entry for the pm10 field */
//        pm10: z.ZodOptional<DetailsEntrySchema>;
//
//        /** The latest entry for the pm25 field */
//        pm25: z.ZodOptional<DetailsEntrySchema>;
//
//        /** The latest entry for the pm100 field */
//        pm100: z.ZodOptional<DetailsEntrySchema>;
//
//        /** The latest entry for the humidity field */
//        humidity: z.ZodOptional<DetailsEntrySchema>;
//
//        /** The latest entry for the o3 (ozone) field */
//        o3: z.ZodOptional<DetailsEntrySchema>;
//
//        /** The latest entry for the no2 (nitrogen dioxide) field */
//        no2: z.ZodOptional<DetailsEntrySchema>;
//
//        /** The latest entry for the pressure field */
//        pressure: z.ZodOptional<DetailsEntrySchema>;
//
//        /** The latest entry for the temperature field */
//        temperature: z.ZodOptional<DetailsEntrySchema>;
//
//        /** The latest entry for the particulates field */
//        particulates: z.ZodOptional<
//          Omit<MonitorParticulatesEntrySchema["shape"], "entry_type">
//        >;
//      };
//    }
//  > {}

interface BaseParticulatesEntrySchema extends
  z.ZodObject<
    Omit<MonitorParticulatesEntrySchema["shape"], "entry_type">
  > {}

export interface MonitorDetailsSchema extends
  z.ZodObject<
    MonitorDataSchema["shape"] & {
      /** The latest specified entry for a given monitor */
      latest: z.ZodObject<{
        /** The latest entry for the pm10 field */
        pm10: z.ZodOptional<DetailsEntrySchema>;

        /** The latest entry for the pm25 field */
        pm25: z.ZodOptional<DetailsEntrySchema>;

        /** The latest entry for the pm100 field */
        pm100: z.ZodOptional<DetailsEntrySchema>;

        /** The latest entry for the humidity field */
        humidity: z.ZodOptional<DetailsEntrySchema>;

        /** The latest entry for the o3 (ozone) field */
        o3: z.ZodOptional<DetailsEntrySchema>;

        /** The latest entry for the no2 (nitrogen dioxide) field */
        no2: z.ZodOptional<DetailsEntrySchema>;

        /** The latest entry for the pressure field */
        pressure: z.ZodOptional<DetailsEntrySchema>;

        /** The latest entry for the temperature field */
        temperature: z.ZodOptional<DetailsEntrySchema>;

        /** The latest entry for the particulates field */
        particulates: z.ZodOptional<BaseParticulatesEntrySchema>;
      }>;
    }
  > {}
export const monitorDetailsSchema: MonitorDetailsSchema = monitorDataSchema
  .extend({
    latest: z.object({
      pm10: z.optional(detailsEntrySchema),
      pm25: z.optional(detailsEntrySchema),
      pm100: z.optional(detailsEntrySchema),
      humidity: z.optional(detailsEntrySchema),
      o3: z.optional(detailsEntrySchema),
      no2: z.optional(detailsEntrySchema),
      pressure: z.optional(detailsEntrySchema),
      temperature: z.optional(detailsEntrySchema),
      particulates: z.optional(
        monitorParticulatesEntrySchema.omit({ entry_type: true }),
      ),
    }),
  });
