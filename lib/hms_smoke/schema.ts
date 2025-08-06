import type { JSONSchemaType } from "ajv";
import type { HMSSmokeGeoJSON } from "./types.ts";
//import { schemaValidator } from "../../schema.ts";

//  id: string;
//  satellite: string;
//  density: "light" | "medium" | "heavy";
//  end: string;
//  start: string;
//  date: string;
//  geometry: MultiPolygon;
//  is_final: boolean;

export const hmsSmokeSchema: JSONSchemaType<HMSSmokeGeoJSON> = {
  type: "object",
  properties: {
    id: { type: "string" },
    satellite: { type: "string" },
    density: { type: "string", enum: ["light", "medium", "heavy"] },
    end: { type: "string" },
    start: { type: "string" },
    date: { type: "string" },
    geometry: {
      type: "object",
      properties: {
        coordinates: [],
        type: "MultiPolygon",
        bbox: undefined,
      },
      required: ["coordinates", "type"],
    },
    is_final: { type: "boolean" },
  },
  required: ["id", "reference_id", "colocated_id", "name", "position"],
  additionalProperties: false,
};

//export const validateMonitorDataSchema = schemaValidator(monitorDataSchema);
