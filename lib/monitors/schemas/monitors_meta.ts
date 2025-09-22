import * as z from "zod";

interface SJVAirMonitorEntryMetaSchema extends
  z.ZodObject<{
    /** The labels for each sensor, if this monitor has more than one. */
    sensors: z.ZodNullable<z.ZodTuple<[z.ZodString, z.ZodString]>>;
    /** The allowed stages for data of this entry type to  be in */
    allowed_stages: z.ZodArray<z.ZodString>;
    /** The default stage to present for this entry type */
    default_stage: z.ZodString;
    /** The default calibration used on this entry type's data */
    default_calibration: z.ZodString;
    /** The processors used on this entry type's data */
    processors: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>;
  }> {}
export const sjvairMonitorEntryMetaSchema: SJVAirMonitorEntryMetaSchema = z
  .object({
    sensors: z.tuple([z.string(), z.string()]).nullable(),
    allowed_stages: z.array(z.string()),
    default_stage: z.string(),
    default_calibration: z.string(),
    processors: z.record(z.string(), z.array(z.string())),
  });

interface SJVAirMonitorDeviceMetaSchema extends
  z.ZodObject<{
    /** The type of this monitor in presentation form */
    label: z.ZodString;
    /** The type of this monitor in data form */
    type: z.ZodString;
    /** The Expected duration between new entries from this monitor */
    expected_interval: z.ZodString;
    /** The types entries received from this monitor */
    entries: z.ZodRecord<z.ZodString, SJVAirMonitorEntryMetaSchema>;
  }> {}
export const sjvairMonitorDeviceMetaSchema: SJVAirMonitorDeviceMetaSchema = z
  .object({
    label: z.string(),
    type: z.string(),
    expected_interval: z.string(),
    entries: z.record(z.string(), sjvairMonitorEntryMetaSchema),
  });

interface SJVAirEntryLevelMetaSchema extends
  z.ZodObject<{
    /** The name of this level in data form */
    name: z.ZodString;
    /** The name of this level in presentation form */
    label: z.ZodString;
    /** The color used to represent this level */
    color: z.ZodString;
    /** The inclusive start and end values for this level */
    range: z.ZodTuple<[z.ZodNumber, z.ZodNumber]>;
    /** A presentable representation of any notice that may accompany this level */
    guidance: z.ZodNullable<z.ZodString>;
  }> {}
export const sjvairEntryLevelMetaSchema: SJVAirEntryLevelMetaSchema = z.object({
  name: z.string(),
  label: z.string(),
  color: z.string(),
  range: z.tuple([z.number(), z.number()]),
  guidance: z.string().nullable(),
});

interface SJVAirEntryMetaSchema extends
  z.ZodObject<{
    /** The name of this entry type in presentation form */
    label: z.ZodString;
    /** The name of this entry type in data form */
    type: z.ZodString;
    /** The presentable unit of measurement for this entry type's value */
    units: z.ZodNullable<z.ZodString>;
    /** The code used to represent this entry type in the EPA's Air Quality System */
    epa_aqs_code: z.ZodNullable<z.ZodNumber>;
    /** The breakpoints used to represent the severity of this entry type's value */
    levels: z.ZodNullable<z.ZodRecord<z.ZodString, SJVAirEntryLevelMetaSchema>>;
    /** The fields included on this entry type */
    fields: z.ZodArray<z.ZodString>;
  }> {}
export const sjvairEntryMetaSchema: SJVAirEntryMetaSchema = z.object({
  label: z.string(),
  type: z.string(),
  units: z.string().nullable(),
  epa_aqs_code: z.number().nullable(),
  levels: z.record(z.string(), sjvairEntryLevelMetaSchema).nullable(),
  fields: z.array(z.string()),
});

interface SJVAirMonitorsMetaSchema extends
  z.ZodObject<{
    /** The default pollutant to display */
    default_pollutant: z.ZodEnum<{ pm25: "pm25"; o3: "o3" }>;
    /** The types of monitors used by SJVAir */
    monitors: z.ZodRecord<z.ZodString, SJVAirMonitorDeviceMetaSchema>;
    /** The types of entries contained in SJVAir */
    entries: z.ZodRecord<z.ZodString, SJVAirEntryMetaSchema>;
  }> {}

export const sjvairMonitorsMetaSchema: SJVAirMonitorsMetaSchema = z.object({
  default_pollutant: z.enum(["pm25", "o3"]),
  monitors: z.record(z.string(), sjvairMonitorDeviceMetaSchema),
  entries: z.record(z.string(), sjvairEntryMetaSchema),
});
