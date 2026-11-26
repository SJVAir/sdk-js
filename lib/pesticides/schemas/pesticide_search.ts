import * as z from "zod";

export interface PesticideSearchHitSchema extends
  z.ZodObject<{
    /** The entity's id: what `getPesticidesForPlace` takes as a filter */
    id: z.ZodString;
    /** The name to show (a chemical's preferred name where it reads better) */
    name: z.ZodString;
    /**
     * A labeled CDPR code ("CDPR chem code 560", "CDPR site code 29139"),
     * with a chemical's CDPR name in front when it differs; empty when none
     */
    detail: z.ZodString;
  }> {}

/** One product or commodity match from pesticides/search */
export const pesticideSearchHitSchema: PesticideSearchHitSchema = z.object({
  id: z.string(),
  name: z.string(),
  detail: z.string(),
});

export interface ChemicalSearchHitSchema extends
  z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    detail: z.ZodString;
    /**
     * Whether this is one of CDPR's stand-ins for an unnamed ingredient
     * (UNKNOWN, AI IS CONFIDENTIAL), which a picker can leave out
     */
    placeholder: z.ZodBoolean;
  }> {}

/** One chemical match from pesticides/search */
export const chemicalSearchHitSchema: ChemicalSearchHitSchema =
  pesticideSearchHitSchema.extend({ placeholder: z.boolean() });
