import * as z from "zod";

/** The type of a given entry */
export type MonitorEntryTypeSchema = z.ZodEnum<{
  pm10: "pm10";
  pm25: "pm25";
  pm100: "pm100";
  humidity: "humidity";
  o3: "o3";
  no2: "no2";
  pressure: "pressure";
  temperature: "temperature";
  particulates: "particulates";
}>;

export const monitorEntryTypeSchema: MonitorEntryTypeSchema = z.enum(
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
