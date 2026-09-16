import * as z from "zod";
import { type CommoditySchema, commoditySchema } from "./commodity.ts";
import { type ChemicalSchema, chemicalSchema } from "./chemical.ts";
import { type ProductSchema, productSchema } from "./product.ts";

export interface CommodityDetailSchema extends
  z.ZodObject<
    CommoditySchema["shape"] & {
      /** The chemicals that have been applied to this commodity */
      chemicals: z.ZodArray<ChemicalSchema>;

      /** The products that have been applied to this commodity */
      products: z.ZodArray<ProductSchema>;
    }
  > {}

export const commodityDetailSchema: CommodityDetailSchema = commoditySchema
  .extend({
    chemicals: z.array(chemicalSchema),
    products: z.array(productSchema),
  });
