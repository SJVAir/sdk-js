import * as z from "zod";

export interface CommoditySchema extends
  z.ZodObject<{
    /** The ID of the commodity */
    id: z.ZodString;

    /** The DPR site code for this commodity */
    site_code: z.ZodString;

    /** The name of the commodity */
    name: z.ZodString;
  }> {}

export const commoditySchema: CommoditySchema = z.object({
  id: z.string(),
  site_code: z.string(),
  name: z.string(),
});
