import * as z from "zod";

/** The summary resolutions a dataset entry type can be read at */
export type ResolutionSchema = z.ZodEnum<{
  raw: "raw";
  hour: "hour";
  day: "day";
  month: "month";
  quarter: "quarter";
  season: "season";
  year: "year";
}>;
export const resolutionSchema: ResolutionSchema = z.enum(
  [
    "raw",
    "hour",
    "day",
    "month",
    "quarter",
    "season",
    "year",
  ] as const,
);

/** The kinds of place a dataset's data can be attached to */
export type GeographySchema = z.ZodEnum<{
  monitor: "monitor";
  region: "region";
  point: "point";
  polygon: "polygon";
  zone: "zone";
  zip: "zip";
  tract: "tract";
}>;
export const geographySchema: GeographySchema = z.enum(
  [
    "monitor",
    "region",
    "point",
    "polygon",
    "zone",
    "zip",
    "tract",
  ] as const,
);

/** The broad class an entry type belongs to */
export type DatasetEntryKindSchema = z.ZodEnum<{
  pollutant: "pollutant";
  meteorological: "meteorological";
  other: "other";
}>;
export const datasetEntryKindSchema: DatasetEntryKindSchema = z.enum(
  [
    "pollutant",
    "meteorological",
    "other",
  ] as const,
);

interface RetiredSchema extends
  z.ZodObject<{
    /** When the id was retired, as an ISO 8601 timestamp */
    since: z.ZodString;
    /** The permanent code of whatever replaced it, if anything */
    replaced_by: z.ZodOptional<
      z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>
    >;
  }> {}
/** The marker on a dataset or entry type that is no longer current */
export const retiredSchema: RetiredSchema = z.object({
  since: z.string(),
  replaced_by: z.record(z.string(), z.string()).nullable().optional(),
});

interface DatasetEntryTypeSchema extends
  z.ZodObject<{
    /** The permanent id of this entry type */
    id: z.ZodString;
    /** The entry type in presentation form */
    label: z.ZodString;
    /** The broad class this entry type belongs to */
    kind: typeof datasetEntryKindSchema;
    /** The presentable unit of measurement, or an empty string */
    units: z.ZodString;
    /** The resolutions this entry type can be summarized at */
    resolutions: z.ZodArray<typeof resolutionSchema>;
    /** Null while current; the retirement marker once retired */
    retired: z.ZodNullable<typeof retiredSchema>;
    /** Whether this pollutant is published on the map (air-quality pollutants only) */
    available: z.ZodOptional<z.ZodBoolean>;
  }> {}
export const datasetEntryTypeSchema: DatasetEntryTypeSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: datasetEntryKindSchema,
  units: z.string(),
  resolutions: z.array(resolutionSchema),
  retired: retiredSchema.nullable(),
  available: z.boolean().optional(),
});

interface DatasetCatalogEntrySchema extends
  z.ZodObject<{
    /** The permanent id of this dataset */
    id: z.ZodString;
    /** The dataset in presentation form */
    label: z.ZodString;
    /** A sentence describing the dataset */
    description: z.ZodString;
    /** Where the data comes from */
    source: z.ZodString;
    /** The data's license, or an empty string when none is stated */
    license: z.ZodString;
    /** The kinds of place the data is attached to */
    geographies: z.ZodArray<typeof geographySchema>;
    /** A URL for further metadata about this dataset, or an empty string */
    meta_url: z.ZodString;
    /** The entry types the dataset holds */
    entry_types: z.ZodArray<DatasetEntryTypeSchema>;
    /** Null while current; the retirement marker once retired */
    retired: z.ZodNullable<typeof retiredSchema>;
  }> {}
export const datasetCatalogEntrySchema: DatasetCatalogEntrySchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  source: z.string(),
  license: z.string(),
  geographies: z.array(geographySchema),
  meta_url: z.string(),
  entry_types: z.array(datasetEntryTypeSchema),
  retired: retiredSchema.nullable(),
});

interface DatasetCatalogSchema extends
  z.ZodObject<{
    /** Every dataset the server has */
    datasets: z.ZodArray<DatasetCatalogEntrySchema>;
    /** The resolutions that are only complete after their period has ended */
    summary_rules: z.ZodObject<{
      complete_after_period_end: z.ZodArray<typeof resolutionSchema>;
    }>;
  }> {}
export const datasetCatalogSchema: DatasetCatalogSchema = z.object({
  datasets: z.array(datasetCatalogEntrySchema),
  summary_rules: z.object({
    complete_after_period_end: z.array(resolutionSchema),
  }),
});
