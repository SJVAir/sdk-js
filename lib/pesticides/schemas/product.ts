import * as z from "zod";

export interface ProductSchema extends
  z.ZodObject<{
    /** The ID of the product */
    id: z.ZodString;

    /** The DPR product number */
    prodno: z.ZodNumber;

    /** The product's pesticide registration number */
    reg_number: z.ZodString;

    /** The name of the product */
    name: z.ZodString;

    /** Whether the product is a fumigant */
    fumigant: z.ZodBoolean;

    /** Whether the product is restricted for use in California */
    california_restricted: z.ZodBoolean;
  }> {}

export const productSchema: ProductSchema = z.object({
  id: z.string(),
  prodno: z.number(),
  reg_number: z.string(),
  name: z.string(),
  fumigant: z.boolean(),
  california_restricted: z.boolean(),
});
