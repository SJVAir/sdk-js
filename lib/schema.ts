import * as z from "zod";

export type GeoJSONPointSchema = z.ZodObject<{
  /** The point coordinates of a monitor */
  coordinates: z.ZodArray<z.ZodNumber>;

  /** The type of GeoJSON object returned */
  type: z.ZodLiteral;
}>;

export const geoJSONPointSchema: GeoJSONPointSchema = z.object({
  coordinates: z.array(z.number()).length(2),
  type: z.literal("Point"),
});

export interface MultiPolygonSchema extends
  z.ZodObject<{
    type: z.ZodLiteral<"MultiPolygon">;
    coordinates: z.ZodArray<
      z.ZodArray<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber]>>>
    >;
  }> {}

export const multiPolygonSchema: MultiPolygonSchema = z.object({
  type: z.literal("MultiPolygon"),
  coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))),
});

/**
 * Any string beyond the known values. `NonNullable<unknown>` is `{}`, which
 * stops TypeScript from collapsing the known values into plain `string`.
 */
export type OtherString = string & NonNullable<unknown>;

/**
 * A schema for a value the server may extend: the known values, or any other
 * string, kept unchanged. The inferred type keeps the known values for
 * autocompletion.
 */
export type OpenEnumSchema<T extends readonly [string, ...string[]]> =
  z.ZodUnion<
    readonly [
      z.ZodEnum<{ [K in T[number]]: K }>,
      z.ZodType<OtherString>,
    ]
  >;

/** Builds an {@link OpenEnumSchema} from the known values. */
export function openEnum<const T extends readonly [string, ...string[]]>(
  values: T,
): OpenEnumSchema<T> {
  return z.union([
    z.enum(values) as unknown as z.ZodEnum<{ [K in T[number]]: K }>,
    z.string() as z.ZodType<OtherString>,
  ]);
}

export function getSimpleValidation<T extends z.ZodType>(
  schema: T,
  errorHandler: (error: z.ZodError, item: z.infer<T>) => void,
) {
  return (items: z.infer<T> | Array<z.infer<T>>) => {
    if (Array.isArray(items)) {
      items.forEach((i) => {
        try {
          schema.parse(i);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errorHandler(error, i);
          }
        }
      });
    } else {
      try {
        schema.parse(items);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errorHandler(error, items);
        }
      }
    }
  };
}
