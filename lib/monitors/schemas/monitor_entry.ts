import * as z from "zod";

/** The type of a given entry */
export const monitorEntryTypeSchema = z.enum(
  [
    "pm10",
    "pm25",
    "pm100",
    "humidity",
    "o3",
    "no2",
    "pressure",
    "temperature",
    "particulates",
  ] as const,
);

export const monitorEntryMetaSchema = z.object({
  /** The specific sensor on a dual sensor monitor which this entry came from */
  sensor: z.string(),

  /** The timestamp at which this entry was recieved */
  timestamp: z.string(),

  /** The stage at which this entry is currently processed */
  stage: z.string(),

  /** The processor, if any, for the current entry */
  processor: z.string(),

  /** The type of data this entry represents */
  entry_type: monitorEntryTypeSchema,
});

export const monitorEntrySchema = monitorEntryMetaSchema.extend({
  /** The single value for this entry type */
  value: z.string(),
});

export const monitorTemperatureEntrySchema = monitorEntryMetaSchema.extend({
  /** The type of data this entry represents */
  entry_type: z.literal("temperature"),

  /** The value in fahrenheit */
  temperature_f: z.string(),

  /** The value in celsius */
  temperature_c: z.string(),
});

export const monitorPressureEntrySchema = monitorEntryMetaSchema.extend({
  /** The type of data this entry represents */
  entry_type: z.literal("pressure"),

  /** The pressure in millimeters of mercury */
  pressure_mmhg: z.string(),

  /** The pressure in hectopascals */
  pressure_hpa: z.string(),
});

export const monitorParticulatesEntrySchema = monitorEntryMetaSchema.extend({
  /** The type of data this entry represents */
  entry_type: z.literal("particulates"),

  /** The count for particulates 0.3 microns */
  particles_03um: z.nullable(z.string()),

  /** The count for particulates of 0.5 microns */
  particles_05um: z.nullable(z.string()),

  /** The count for particulates of 1 micron */
  particles_10um: z.nullable(z.string()),

  /** The count for particulates for 2.5 microns */
  particles_25um: z.nullable(z.string()),

  /** The count for particulates of 5 microns */
  particles_50um: z.nullable(z.string()),

  /** The count for particulates of 10 microns */
  particles_100um: z.nullable(z.string()),
});

/** A utility schema for validating all possigle entry types */
export const someMonitorEntrySchema = z.union([
  monitorEntrySchema,
  monitorTemperatureEntrySchema,
  monitorPressureEntrySchema,
  monitorParticulatesEntrySchema,
]);
