import type { JSONSchemaType } from "ajv";
import type {
  MonitorData,
  MonitorDataProvider,
  MonitorDataSource,
  MonitorDetails,
  MonitorDevice,
  MonitorLatest,
  MonitorLatestEntry,
  MonitorLatestParticulatesEntry,
  MonitorPosition,
} from "../types.ts";
import { schemaValidator } from "../../schema.ts";

export const monitorDeviceSchema: JSONSchemaType<MonitorDevice> = {
  type: "string",
  enum: [
    "PurpleAir",
    "BAM 1020",
    "BAM 1022",
    "PA-I",
    "PA-I-LED",
    "PA-II-FLEX",
    "PA-II",
    "PA-II-SD",
    "UNKNOWN",
  ],
};

export const monitorDataSourceSchema: JSONSchemaType<MonitorDataSource> = {
  type: "object",
  properties: {
    name: {
      type: "string",
      enum: [
        "PurpleAir",
        "AQview",
        "AirNow.gov",
        "Central California Asthma Collaborative",
      ],
    },
    url: { type: "string" },
  },
  required: ["name", "url"],
};

export const monitorDataProvidersSchema: JSONSchemaType<MonitorDataProvider> = {
  type: "object",
  properties: {
    name: {
      type: "string",
      enum: [
        "PurpleAir",
        "AQview",
        "AirNow.gov",
        "California Air Resources Board",
        "Central California Asthma Collaborative",
        "AirNow Partners",
        "Eastern Kern Air Pollution Control District",
        "Forest Service",
        "National Park Service",
        "San Joaquin Valley APCD",
        "San Joaquin Valley Unified APCD",
      ],
    },
    url: { type: "string", nullable: true },
  },
  required: ["name"],
};

export const monitorPositionSchema: JSONSchemaType<MonitorPosition> = {
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

export const monitorDataSchema: JSONSchemaType<MonitorData> = {
  type: "object",
  properties: {
    county: { type: "string" },
    data_source: monitorDataSourceSchema,
    data_providers: { type: "array", items: monitorDataProvidersSchema },
    device: monitorDeviceSchema,
    id: { type: "string" },
    is_active: { type: "boolean" },
    is_sjvair: { type: "boolean" },
    last_active_limit: { type: "number" },
    location: { type: "string" },
    name: { type: "string" },
    position: monitorPositionSchema,
    purple_id: { type: "number", nullable: true },
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
    "location",
    "name",
    "position",
  ],
  additionalProperties: false,
};

export const monitorLatestEntrySchema: JSONSchemaType<MonitorLatestEntry> = {
  type: "object",
  properties: {
    value: { type: "string" },
    sensor: { type: "string" },
    timestamp: { type: "string" },
    calibration: {
      oneOf: [{ type: "string" }, { type: "null", nullable: true }],
    },
  },
  required: ["value", "sensor", "timestamp", "calibration"],
};

export const monitorLatestParticulatesEntrySchema: JSONSchemaType<
  MonitorLatestParticulatesEntry
> = {
  type: "object",
  properties: {
    particles_03um: { type: "string", nullable: true },
    particles_05um: { type: "string", nullable: true },
    particles_10um: { type: "string", nullable: true },
    particles_25um: { type: "string", nullable: true },
    particles_50um: { type: "string", nullable: true },
    particles_100um: { type: "string", nullable: true },
    sensor: { type: "string" },
    timestamp: { type: "string" },
    calibration: {
      oneOf: [{ type: "string" }, { type: "null", nullable: true }],
    },
  },
  required: ["sensor", "timestamp", "calibration"],
};

export const monitorLatestSchema: JSONSchemaType<MonitorLatest> = {
  type: "object",
  properties: {
    pm10: { ...monitorLatestEntrySchema, nullable: true },
    pm25: { ...monitorLatestEntrySchema, nullable: true },
    pm100: { ...monitorLatestEntrySchema, nullable: true },
    humidity: { ...monitorLatestEntrySchema, nullable: true },
    o3: { ...monitorLatestEntrySchema, nullable: true },
    pressure: { ...monitorLatestEntrySchema, nullable: true },
    temperature: { ...monitorLatestEntrySchema, nullable: true },
    particulates: { ...monitorLatestParticulatesEntrySchema, nullable: true },
  },
};

export const monitorDetailsSchema: JSONSchemaType<MonitorDetails> = {
  type: "object",
  allOf: [
    {
      ...monitorDataSchema,
      additionalProperties: true,
    },
    {
      type: "object",
      properties: {
        latest: monitorLatestSchema,
      },
      required: ["latest"],
    },
  ],
  required: [],
};

export const validateMonitorDetailsSchema = schemaValidator(
  monitorDetailsSchema,
);

export const validateMonitorDataSchema = schemaValidator(monitorDataSchema);
