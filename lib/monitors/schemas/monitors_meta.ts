import * as z from "zod";
import { resolutionSchema } from "../../meta/schemas/dataset_catalog.ts";
import {
  choiceSchema,
  scaleSchema,
  scaleSourceSchema,
} from "../../meta/schemas/scale.ts";

interface MonitorEntryAlertsMetaSchema extends
  z.ZodObject<{
    /** The window the alert run averages over, in presentation form (e.g. "60 min") */
    window: z.ZodString;
    /** The share of the window's expected readings that must be present, from 0 to 1 */
    min_coverage: z.ZodNumber;
    /** The stage of the entries the alert run evaluates */
    stage: z.ZodString;
    /** The processor of the entries the alert run evaluates, or null when it doesn't filter on one */
    processor: z.ZodNullable<z.ZodString>;
    /** The interval between entries at this stage when it differs from the monitor's, or null */
    expected_interval: z.ZodNullable<z.ZodString>;
  }> {}
/** How the alert run evaluates an entry type on a monitor type */
export const monitorEntryAlertsMetaSchema: MonitorEntryAlertsMetaSchema = z
  .object({
    window: z.string(),
    min_coverage: z.number(),
    stage: z.string(),
    processor: z.string().nullable(),
    expected_interval: z.string().nullable(),
  });

interface SJVAirMonitorEntryMetaSchema extends
  z.ZodObject<{
    /** The labels for each sensor, if this monitor has more than one. */
    sensors: z.ZodNullable<z.ZodArray<z.ZodString>>;
    /** Whether the map endpoints show this entry type for this monitor type */
    published: z.ZodBoolean;
    /** The allowed stages for data of this entry type to  be in */
    allowed_stages: z.ZodArray<z.ZodString>;
    /** The default stage to present for this entry type */
    default_stage: z.ZodString;
    /** The default calibration used on this entry type's data */
    default_calibration: z.ZodString;
    /** The processors used on this entry type's data */
    processors: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>;
    /** How the alert run evaluates this entry type, or null when it doesn't */
    alerts: z.ZodNullable<MonitorEntryAlertsMetaSchema>;
  }> {}
export const sjvairMonitorEntryMetaSchema: SJVAirMonitorEntryMetaSchema = z
  .object({
    sensors: z.array(z.string()).nullable(),
    published: z.boolean(),
    allowed_stages: z.array(z.string()),
    default_stage: z.string(),
    default_calibration: z.string(),
    processors: z.record(z.string(), z.array(z.string())),
    alerts: monitorEntryAlertsMetaSchema.nullable(),
  });

interface SJVAirMonitorDeviceMetaSchema extends
  z.ZodObject<{
    /** The type of this monitor in presentation form */
    label: z.ZodString;
    /** The type of this monitor in data form */
    type: z.ZodString;
    /** The `monitor_groups` key of this monitor type, or null when it has no grade */
    group: z.ZodNullable<z.ZodString>;
    /** The Expected duration between new entries from this monitor */
    expected_interval: z.ZodString;
    /** The types entries received from this monitor */
    entries: z.ZodRecord<z.ZodString, SJVAirMonitorEntryMetaSchema>;
  }> {}
export const sjvairMonitorDeviceMetaSchema: SJVAirMonitorDeviceMetaSchema = z
  .object({
    label: z.string(),
    type: z.string(),
    group: z.string().nullable(),
    expected_interval: z.string(),
    entries: z.record(z.string(), sjvairMonitorEntryMetaSchema),
  });

interface SchoolActivitySchema extends
  z.ZodObject<{
    /** The permanent key of this activity */
    key: z.ZodEnum<{
      recess: "recess";
      pe: "pe";
      athletics: "athletics";
      events: "events";
    }>;
    /** The activity in presentation form */
    label: z.ZodString;
    /** How long the activity lasts in presentation form, if stated */
    duration: z.ZodNullable<z.ZodString>;
    /** The guidance for each level, keyed by the scale's level keys, as paragraphs */
    levels: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>;
  }> {}
/** One school activity and its guidance at each level */
export const schoolActivitySchema: SchoolActivitySchema = z.object({
  key: z.enum(["recess", "pe", "athletics", "events"]),
  label: z.string(),
  duration: z.string().nullable(),
  levels: z.record(z.string(), z.array(z.string())),
});

interface SchoolGuidelinesSchema extends
  z.ZodObject<{
    /** The guidelines in presentation form */
    label: z.ZodString;
    /** The resolution of the values the guidelines apply to */
    resolution: typeof resolutionSchema;
    /** Where the guidelines come from */
    source: typeof scaleSourceSchema;
    /** The activities, in order */
    activities: z.ZodArray<SchoolActivitySchema>;
  }> {}
/** Outdoor activity guidelines for schools, by level */
export const schoolGuidelinesSchema: SchoolGuidelinesSchema = z.object({
  label: z.string(),
  resolution: resolutionSchema,
  source: scaleSourceSchema,
  activities: z.array(schoolActivitySchema),
});

interface SJVAirEntryMetaSchema extends
  z.ZodObject<{
    /** The name of this entry type in presentation form */
    label: z.ZodString;
    /** The name of this entry type in data form */
    type: z.ZodString;
    /** Short plain help text for this entry type, or null */
    description: z.ZodNullable<z.ZodString>;
    /** The presentable unit of measurement for this entry type's value */
    units: z.ZodNullable<z.ZodString>;
    /** The code used to represent this entry type in the EPA's Air Quality System */
    epa_aqs_code: z.ZodNullable<z.ZodNumber>;
    /** The fields included on this entry type */
    fields: z.ZodArray<z.ZodString>;
    /** The scale that turns this entry type's value into a level */
    scale: z.ZodNullable<typeof scaleSchema>;
    /** Outdoor activity guidelines for schools, if this entry type has them */
    school_guidelines: z.ZodNullable<SchoolGuidelinesSchema>;
  }> {}
export const sjvairEntryMetaSchema: SJVAirEntryMetaSchema = z.object({
  label: z.string(),
  type: z.string(),
  description: z.string().nullable(),
  units: z.string().nullable(),
  epa_aqs_code: z.number().nullable(),
  fields: z.array(z.string()),
  scale: scaleSchema.nullable(),
  school_guidelines: schoolGuidelinesSchema.nullable(),
});

interface MonitorGroupSchema extends
  z.ZodObject<{
    /** The permanent id of this group */
    key: z.ZodString;
    /** The group in presentation form */
    label: z.ZodString;
    /** Where this group sorts; lower first */
    order: z.ZodNumber;
  }> {}
/** A group that monitor types are listed under, such as "Reference-grade" */
export const monitorGroupSchema: MonitorGroupSchema = z.object({
  key: z.string(),
  label: z.string(),
  order: z.number(),
});

interface SJVAirMonitorsMetaSchema extends
  z.ZodObject<{
    /** The default pollutant to display */
    default_pollutant: z.ZodEnum<{ pm25: "pm25"; o3: "o3" }>;
    /** The entry types published on the map (pollutants with a default calibration) */
    available_pollutants: z.ZodArray<z.ZodString>;
    /** The types of monitors used by SJVAir */
    monitors: z.ZodRecord<z.ZodString, SJVAirMonitorDeviceMetaSchema>;
    /** The groups monitor types are listed under, by id; sort by `order` */
    monitor_groups: z.ZodRecord<z.ZodString, MonitorGroupSchema>;
    /** The types of entries contained in SJVAir */
    entries: z.ZodRecord<z.ZodString, SJVAirEntryMetaSchema>;
    /** The data stages, by key */
    stages: z.ZodRecord<z.ZodString, typeof choiceSchema>;
    /** The processors, by key */
    processors: z.ZodRecord<z.ZodString, typeof choiceSchema>;
  }> {}

export const sjvairMonitorsMetaSchema: SJVAirMonitorsMetaSchema = z.object({
  default_pollutant: z.enum(["pm25", "o3"]),
  available_pollutants: z.array(z.string()),
  monitors: z.record(z.string(), sjvairMonitorDeviceMetaSchema),
  monitor_groups: z.record(z.string(), monitorGroupSchema),
  entries: z.record(z.string(), sjvairEntryMetaSchema),
  stages: z.record(z.string(), choiceSchema),
  processors: z.record(z.string(), choiceSchema),
});
