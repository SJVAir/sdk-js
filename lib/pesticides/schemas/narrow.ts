import * as z from "zod";

/**
 * A pesticide narrowing (`?narrow=`): concern chemicals, restricted products,
 * fumigant products, or aerial applications. `getPesticidesMeta()` labels and
 * describes each.
 */
export type PesticideNarrowSchema = z.ZodEnum<{
  concern: "concern";
  restricted: "restricted";
  fumigant: "fumigant";
  aerial: "aerial";
}>;

export const pesticideNarrowSchema: PesticideNarrowSchema = z.enum(
  ["concern", "restricted", "fumigant", "aerial"] as const,
);
