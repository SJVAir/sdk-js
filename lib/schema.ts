import { type infer as zinfer, ZodError, type ZodType } from "zod";

export function getSimpleValidation<T extends ZodType>(
  schema: T,
  errorHandler: (error: ZodError, item: zinfer<T>) => void,
) {
  return (items: zinfer<T> | Array<zinfer<T>>) => {
    if (Array.isArray(items)) {
      items.forEach((i) => {
        try {
          schema.parse(i);
        } catch (error) {
          if (error instanceof ZodError) {
            errorHandler(error, i);
          }
        }
      });
    } else {
      try {
        schema.parse(items);
      } catch (error) {
        if (error instanceof ZodError) {
          errorHandler(error, items);
        }
      }
    }
  };
}
