import type { JSONSchemaType } from "ajv";
import { schemaValidator } from "../../schema.ts";
import type {
  MonitorData,
  MonitorDataProvider,
  MonitorDataSource,
  MonitorDetails,
  MonitorDetailsEntries,
  MonitorDetailsEntry,
  MonitorDetailsParticulatesEntry,
  MonitorDevice,
  MonitorEntry,
  MonitorEntryMeta,
  MonitorPosition,
} from "../types.ts";

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

export const monitorEntryMetaSchema: JSONSchemaType<MonitorEntryMeta> = {
  type: "object",
  properties: {
    sensor: { type: "string" },
    timestamp: { type: "string" },
    stage: { type: "string" },
    processor: { type: "string" },
  },
  required: ["sensor", "timestamp", "stage", "processor"],
};

export const ZmonitorEntryMetaSchema: JSONSchemaType<MonitorEntry> = {
  type: "object",
  properties: {
    value: { type: "string" },
    sensor: { type: "string" },
    timestamp: { type: "string" },
    stage: { type: "string" },
    processor: { type: "string" },
  },
  required: ["value", "sensor", "timestamp", "stage", "processor"],
};
//export const monitorEntrySchema: JSONSchemaType<MonitorEntry> = {
//  type: "object",
//  allOf: [
//    {
//      ...monitorDataSchema,
//    },
//    {
//      type: "object",
//      properties: {
//        latest: monitorDetailsEntriesSchema,
//      },
//      required: ["latest"],
//    },
//  ],
//  required: [],
//};

export const monitorDetailsEntrySchema: JSONSchemaType<MonitorDetailsEntry> = {
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

export const monitorDetailsParticulatesEntrySchema: JSONSchemaType<
  MonitorDetailsParticulatesEntry
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

export const monitorDetailsEntriesSchema: JSONSchemaType<
  MonitorDetailsEntries
> = {
  type: "object",
  properties: {
    pm10: { ...monitorDetailsEntrySchema, nullable: true },
    pm25: { ...monitorDetailsEntrySchema, nullable: true },
    pm100: { ...monitorDetailsEntrySchema, nullable: true },
    humidity: { ...monitorDetailsEntrySchema, nullable: true },
    o3: { ...monitorDetailsEntrySchema, nullable: true },
    no2: { ...monitorDetailsEntrySchema, nullable: true },
    pressure: { ...monitorDetailsEntrySchema, nullable: true },
    temperature: { ...monitorDetailsEntrySchema, nullable: true },
    particulates: { ...monitorDetailsParticulatesEntrySchema, nullable: true },
  },
  additionalProperties: false,
};

export const monitorDetailsSchema: JSONSchemaType<MonitorDetails> = {
  type: "object",
  properties: {
    // Type casting required as ajv has trouble with extended interfaces or extended schemas
    ...monitorDataSchema.properties as JSONSchemaType<
      MonitorDetails
    >["properties"],
    latest: monitorDetailsEntriesSchema,
  },
  required: [...monitorDataSchema.required, "latest"],
  additionalProperties: false,
};

export const validateMonitorDetailsSchema = schemaValidator(
  monitorDetailsSchema,
);

export const validateMonitorDataSchema = schemaValidator(monitorDataSchema);
