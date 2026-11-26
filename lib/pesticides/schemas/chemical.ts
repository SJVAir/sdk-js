import * as z from "zod";
import { type IARCGroupSchema, iarcGroupSchema } from "./iarc_group.ts";

export interface ChemicalSchema extends
  z.ZodObject<{
    /** The ID of the chemical */
    id: z.ZodString;

    /** The DPR chemical code */
    chem_code: z.ZodNumber;

    /** The name of the chemical, as CDPR lists it */
    name: z.ZodString;

    /** The chemical's preferred name from EPA CompTox; empty when it has none */
    preferred_name: z.ZodString;

    /**
     * The name to show: the preferred name where it reads better than CDPR's,
     * otherwise CDPR's name. Pesticide search shows this name.
     */
    display_name: z.ZodString;

    /** The chemical's CAS registry number */
    cas_number: z.ZodString;

    /** The chemical's EPA DTXSID identifier */
    dtxsid: z.ZodString;

    /** The chemical's IARC carcinogenicity classification group */
    iarc_group: z.ZodUnion<readonly [IARCGroupSchema, z.ZodLiteral<"">]>;

    /** The hazard categories this chemical is associated with */
    categories: z.ZodArray<z.ZodString>;

    /**
     * Whether this is one of CDPR's stand-ins for an unnamed ingredient
     * (UNKNOWN, AI IS CONFIDENTIAL): real applications that carry no pounds
     */
    placeholder: z.ZodBoolean;
  }> {}

export const chemicalSchema: ChemicalSchema = z.object({
  id: z.string(),
  chem_code: z.number(),
  name: z.string(),
  preferred_name: z.string(),
  display_name: z.string(),
  cas_number: z.string(),
  dtxsid: z.string(),
  iarc_group: z.union([iarcGroupSchema, z.literal("")]),
  categories: z.array(z.string()),
  placeholder: z.boolean(),
});
