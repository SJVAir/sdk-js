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
