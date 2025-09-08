import { assertTestVariable } from "../testing.ts";

export const coordinates = {
  latitude: assertTestVariable("LATITUDE"),
  longitude: assertTestVariable("LONGITUDE"),
};

export const monitorId = assertTestVariable("MONITOR_ID");
