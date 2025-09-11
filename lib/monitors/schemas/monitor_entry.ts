import * as z from "zod";
import {
  type MonitorEntryMetaSchema,
  monitorEntryMetaSchema,
} from "./monitor_entry_meta.ts";

/** A utility type for defining other entry schemas */
interface BaseMonitorEntryMetaSchema extends
  z.ZodObject<
    Omit<MonitorEntryMetaSchema["shape"], "entry_type">
  > {}

export interface MonitorEntrySchema extends
  z.ZodObject<
    MonitorEntryMetaSchema["shape"] & {
      /** The single value for this entry type */
      value: z.ZodString;
    }
  > {}

export const monitorEntrySchema: MonitorEntrySchema = monitorEntryMetaSchema
  .extend({
    value: z.string(),
  });

export interface MonitorTemperatureEntrySchema extends
  z.ZodObject<
    BaseMonitorEntryMetaSchema["shape"] & {
      /** The type of data this entry represents */
      entry_type: z.ZodLiteral<"temperature">;

      /** The value in fahrenheit */
      temperature_f: z.ZodString;

      /** The value in celsius */
      temperature_c: z.ZodString;
    }
  > {}

export const monitorTemperatureEntrySchema: MonitorTemperatureEntrySchema =
  monitorEntryMetaSchema.extend({
    entry_type: z.literal("temperature"),
    temperature_f: z.string(),
    temperature_c: z.string(),
  });

export interface MonitorPressureEntrySchema extends
  z.ZodObject<
    BaseMonitorEntryMetaSchema["shape"] & {
      /** The type of data this entry represents */
      entry_type: z.ZodLiteral<"pressure">;

      /** The pressure in millimeters of mercury */
      pressure_mmhg: z.ZodString;

      /** The pressure in hectopascals */
      pressure_hpa: z.ZodString;
    }
  > {}

export const monitorPressureEntrySchema: MonitorPressureEntrySchema =
  monitorEntryMetaSchema.extend({
    entry_type: z.literal("pressure"),
    pressure_mmhg: z.string(),
    pressure_hpa: z.string(),
  });

export interface MonitorParticulatesEntrySchema extends
  z.ZodObject<
    BaseMonitorEntryMetaSchema["shape"] & {
      /** The type of data this entry represents */
      entry_type: z.ZodLiteral<"particulates">;

      /** The count for particulates 0.3 microns */
      particles_03um: z.ZodNullable<z.ZodString>;

      /** The count for particulates of 0.5 microns */
      particles_05um: z.ZodNullable<z.ZodString>;

      /** The count for particulates of 1 micron */
      particles_10um: z.ZodNullable<z.ZodString>;

      /** The count for particulates for 2.5 microns */
      particles_25um: z.ZodNullable<z.ZodString>;

      /** The count for particulates of 5 microns */
      particles_50um: z.ZodNullable<z.ZodString>;

      /** The count for particulates of 10 microns */
      particles_100um: z.ZodNullable<z.ZodString>;
    }
  > {}

export const monitorParticulatesEntrySchema: MonitorParticulatesEntrySchema =
  monitorEntryMetaSchema.extend({
    entry_type: z.literal("particulates"),
    particles_03um: z.nullable(z.string()),
    particles_05um: z.nullable(z.string()),
    particles_10um: z.nullable(z.string()),
    particles_25um: z.nullable(z.string()),
    particles_50um: z.nullable(z.string()),
    particles_100um: z.nullable(z.string()),
  });

export type SomeMonitorEntrySchema = z.ZodUnion<[
  MonitorEntrySchema,
  MonitorTemperatureEntrySchema,
  MonitorPressureEntrySchema,
  MonitorParticulatesEntrySchema,
]>;

/** A utility schema for validating all possigle entry types */
export const someMonitorEntrySchema: SomeMonitorEntrySchema = z.union([
  monitorEntrySchema,
  monitorTemperatureEntrySchema,
  monitorPressureEntrySchema,
  monitorParticulatesEntrySchema,
]);
