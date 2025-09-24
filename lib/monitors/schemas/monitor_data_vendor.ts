import * as z from "zod";

export type MonitorDataVendorSchema = z.ZodObject<{
  /** The name of the data vendor */
  name: z.ZodString;

  /** The url of the data vendor's website */
  url: z.ZodOptional<z.ZodString>;
}>;

export const monitorDataVendorSchema: MonitorDataVendorSchema = z.object({
  name: z.string(),
  url: z.optional(z.string()),
});
