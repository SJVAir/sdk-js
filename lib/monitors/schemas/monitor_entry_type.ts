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
  dewpoint: "dewpoint";
  soiltemperature: "soiltemperature";
  windspeed: "windspeed";
  winddirection: "winddirection";
  precipitation: "precipitation";
  solarradiation: "solarradiation";
  netradiation: "netradiation";
  vaporpressure: "vaporpressure";
  eto: "eto";
  etr: "etr";
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
    "dewpoint",
    "soiltemperature",
    "windspeed",
    "winddirection",
    "precipitation",
    "solarradiation",
    "netradiation",
    "vaporpressure",
    "eto",
    "etr",
  ] as const,
);
