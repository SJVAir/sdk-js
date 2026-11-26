import * as z from "zod";
import {
  locationSourceSchema,
  locationTypeSchema,
} from "../../regions/schemas/location.ts";
import type {
  LocationSourceSchema,
  LocationTypeSchema,
} from "../../regions/schemas/location.ts";

/** The properties of a school or child care site on the pesticides map */
export interface PesticideLocationPropertiesSchema extends
  z.ZodObject<{
    /** The location's ID */
    id: z.ZodString;

    /** Where the location's code comes from */
    source: LocationSourceSchema;

    /** The location's permanent code within its source */
    external_id: z.ZodString;

    /** The location's name */
    name: z.ZodString;

    /** The kind of location */
    type: LocationTypeSchema;

    /** A short, human-readable label for the type */
    type_label: z.ZodString;

    /** The street address */
    address: z.ZodString;

    /** The city the location is in */
    city: z.ZodNullable<z.ZodString>;

    /** The name of the school district */
    school_district: z.ZodNullable<z.ZodString>;

    /** The ID of the school district's region */
    school_district_id: z.ZodNullable<z.ZodString>;

    /** The path of the school district's pesticide page */
    school_district_url: z.ZodNullable<z.ZodString>;

    /** The grades served, such as "K-6" */
    grade_span: z.ZodNullable<z.ZodString>;

    /** Total enrollment, when the source reports it */
    enrollment: z.ZodNullable<z.ZodNumber>;

    /** Licensed capacity, when the source reports it */
    capacity: z.ZodNullable<z.ZodNumber>;
  }> {}

export const pesticideLocationPropertiesSchema:
  PesticideLocationPropertiesSchema = z.object({
    id: z.string(),
    source: locationSourceSchema,
    external_id: z.string(),
    name: z.string(),
    type: locationTypeSchema,
    type_label: z.string(),
    address: z.string(),
    city: z.nullable(z.string()),
    school_district: z.nullable(z.string()),
    school_district_id: z.nullable(z.string()),
    school_district_url: z.nullable(z.string()),
    grade_span: z.nullable(z.string()),
    enrollment: z.nullable(z.number()),
    capacity: z.nullable(z.number()),
  });

/** A GeoJSON Point feature for one school or child care site */
export interface PesticideLocationFeatureSchema extends
  z.ZodObject<{
    type: z.ZodLiteral<"Feature">;
    id: z.ZodString;
    geometry: z.ZodObject<{
      type: z.ZodLiteral<"Point">;
      coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    }>;
    properties: PesticideLocationPropertiesSchema;
  }> {}

export const pesticideLocationFeatureSchema: PesticideLocationFeatureSchema = z
  .object({
    type: z.literal("Feature"),
    id: z.string(),
    geometry: z.object({
      type: z.literal("Point"),
      coordinates: z.tuple([z.number(), z.number()]),
    }),
    properties: pesticideLocationPropertiesSchema,
  });

/** The GeoJSON FeatureCollection the locations endpoint answers with */
export interface PesticideLocationCollectionSchema extends
  z.ZodObject<{
    type: z.ZodLiteral<"FeatureCollection">;
    features: z.ZodArray<PesticideLocationFeatureSchema>;
  }> {}

export const pesticideLocationCollectionSchema:
  PesticideLocationCollectionSchema = z.object({
    type: z.literal("FeatureCollection"),
    features: z.array(pesticideLocationFeatureSchema),
  });
