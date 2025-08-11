import type { JSONSchemaType } from "ajv";
import type { HMSSmokeGeoJSON } from "./types.ts";
import { multiPolygonSchema, schemaValidator } from "../schema.ts";

export const hmsSmokeSchema: JSONSchemaType<HMSSmokeGeoJSON> = {
  type: "object",
  properties: {
    id: { type: "string" },
    satellite: { type: "string" },
    density: { type: "string", enum: ["light", "medium", "heavy"] },
    end: { type: "string" },
    start: { type: "string" },
    date: { type: "string" },
    geometry: multiPolygonSchema,
    is_final: { type: "boolean" },
  },
  required: [
    "id",
    "satellite",
    "density",
    "end",
    "start",
    "date",
    "geometry",
    "is_final",
  ],
};

export const validateHMSSmokeSchema = schemaValidator(hmsSmokeSchema);
