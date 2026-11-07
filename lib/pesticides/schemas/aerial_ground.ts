import * as z from "zod";

/** The application method of a pesticide use or summary record */
export type AerialGroundSchema = z.ZodEnum<{
  A: "A";
  F: "F";
  G: "G";
  O: "O";
}>;

export const aerialGroundSchema: AerialGroundSchema = z.enum(
  ["A", "F", "G", "O"] as const,
);

/**
 * An application method a filter can ask for: a record's method, or `none`
 * for records with no reported method. Records themselves never say `none`.
 */
export type AerialGroundFilterSchema = z.ZodEnum<{
  A: "A";
  F: "F";
  G: "G";
  O: "O";
  none: "none";
}>;

export const aerialGroundFilterSchema: AerialGroundFilterSchema = z.enum(
  ["A", "F", "G", "O", "none"] as const,
);
