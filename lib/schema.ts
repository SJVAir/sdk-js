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
