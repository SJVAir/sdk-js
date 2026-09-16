import * as z from "zod";
import { type ChemicalSchema, chemicalSchema } from "./chemical.ts";
import { type ProductSchema, productSchema } from "./product.ts";
import { type CommoditySchema, commoditySchema } from "./commodity.ts";

export interface ChemicalDetailSchema extends
  z.ZodObject<
    ChemicalSchema["shape"] & {
      /** The products this chemical is a component of */
      products: z.ZodArray<ProductSchema>;

      /** The commodities this chemical has been applied to */
      commodities: z.ZodArray<CommoditySchema>;
    }
  > {}

export const chemicalDetailSchema: ChemicalDetailSchema = chemicalSchema
  .extend({
    products: z.array(productSchema),
    commodities: z.array(commoditySchema),
  });
