import * as z from "zod";
import { type ProductSchema, productSchema } from "./product.ts";
import { type ChemicalSchema, chemicalSchema } from "./chemical.ts";
import { type CommoditySchema, commoditySchema } from "./commodity.ts";

export interface ProductDetailSchema extends
  z.ZodObject<
    ProductSchema["shape"] & {
      /** The chemicals this product contains */
      chemicals: z.ZodArray<ChemicalSchema>;

      /** The commodities this product has been applied to */
      commodities: z.ZodArray<CommoditySchema>;
    }
  > {}

export const productDetailSchema: ProductDetailSchema = productSchema
  .extend({
    chemicals: z.array(chemicalSchema),
    commodities: z.array(commoditySchema),
  });
