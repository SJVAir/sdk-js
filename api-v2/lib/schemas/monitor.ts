import { Ajv, type JSONSchemaType } from "ajv";
import type {
  MonitorData,
  MonitorDataSource,
  MonitorDevice,
  MonitorEntry,
  MonitorPosition,
} from "../types.ts";
import type { SchemaValidationFailureHandler } from "./types.ts";

export const monitorDataSource: JSONSchemaType<MonitorDataSource> = {
  type: "object",
  properties: {
    name: {
      type: "string",
      enum: [
        "AirNow.gov",
        "AirNow Partners",
        "AQview",
        "California Air Resources Board",
        "Central California Asthma Collaborative",
        "Eastern Kern Air Pollution Control District",
        "Forest Service",
        "National Park Service",
        "PurpleAir",
        "San Joaquin Valley APCD",
        "San Joaquin Valley Unified APCD",
      ],
    },
    url: { type: "string", nullable: true },
  },
  required: ["name"],
};

export const monitorDevice: JSONSchemaType<MonitorDevice> = {
  type: "string",
  enum: [
    "PurpleAir",
    "BAM 1020",
    "BAM 1022",
    "AQview",
    "PA-I",
    "PA-I-LED",
    "PA-II-FLEX",
    "PA-II",
    "PA-II-SD",
    "UNKNOWN",
  ],
};

export const monitorEntry: JSONSchemaType<MonitorEntry> = {
  type: "object",
  properties: {
    celsius: { type: "string", nullable: true },
    fahrenheit: { type: "string", nullable: true },
    humidity: { type: "string", nullable: true },
    pm10: { type: "string", nullable: true },
    pm10_standard: { type: "string", nullable: true },
    pm25: { type: "string" },
    pm25_avg_15: { type: "string", nullable: true },
    pm25_avg_60: { type: "string", nullable: true },
    pm25_reported: { type: "string", nullable: true },
    pm25_standard: { type: "string", nullable: true },
    pm100: { type: "string", nullable: true },
    pm100_standard: { type: "string", nullable: true },
    particles_03um: { type: "string", nullable: true },
    particles_05um: { type: "string", nullable: true },
    particles_10um: { type: "string", nullable: true },
    particles_25um: { type: "string", nullable: true },
    particles_50um: { type: "string", nullable: true },
    particles_100um: { type: "string", nullable: true },
    pressure: { type: "string", nullable: true },
    sensor: { type: "string" },
    timestamp: { type: "string" },
  },
  required: ["pm25", "sensor", "timestamp"],
};

export const monitorPosition: JSONSchemaType<MonitorPosition> = {
  type: "object",
  properties: {
    coordinates: {
      type: "array",
      items: [{ type: "number" }, { type: "number" }],
      minItems: 2,
      maxItems: 2,
    },
    type: { type: "string" },
  },
  required: ["coordinates", "type"],
};

export const monitorData: JSONSchemaType<MonitorData> = {
  type: "object",
  properties: {
    county: { type: "string" },
    data_source: monitorDataSource,
    data_providers: { type: "array", items: monitorDataSource },
    device: monitorDevice,
    distance: { type: "number", nullable: true },
    id: { type: "string" },
    is_active: { type: "boolean" },
    is_sjvair: { type: "boolean" },
    last_active_limit: { type: "number" },
    latest: {
      type: ["object", "null"],
      oneOf: [monitorEntry, { type: "null", nullable: true }],
    },
    location: { type: "string" },
    name: { type: "string" },
    position: monitorPosition,
    purple_id: { type: "number", nullable: true },
    sensors: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "county",
    "data_source",
    "data_providers",
    "device",
    "id",
    "is_active",
    "is_sjvair",
    "last_active_limit",
    "latest",
    "name",
    "position",
    "sensors",
  ],
};

export function validateMonitorSchema(
  data: MonitorData | Array<MonitorData>,
  failureHandle: SchemaValidationFailureHandler<MonitorData>,
) {
  const ajv = new Ajv();
  const validate = ajv.compile(monitorData);

  const process = (monitor: MonitorData) => {
    const valid = validate(monitor);
    if (!valid) {
      failureHandle(validate.errors, monitor);
    }
  };

  if (Array.isArray(data)) {
    for (const monitor of data) {
      process(monitor);
    }
  } else {
    process(data);
  }
}

export function validateMonitorEntrySchema(
  data: MonitorEntry | Array<MonitorEntry>,
  failureHandle: SchemaValidationFailureHandler<MonitorEntry>,
) {
  const ajv = new Ajv();
  const validate = ajv.compile(monitorEntry);

  const process = (monitorEntry: MonitorEntry) => {
    const valid = validate(monitorEntry);
    if (!valid) {
      failureHandle(validate.errors, monitorEntry);
    }
  };

  if (Array.isArray(data)) {
    for (const entry of data) {
      process(entry);
    }
  } else {
    process(data);
  }
}
