/**
 * Types for the CalHeatScore metadata.
 * @module
 */
import type { infer as zinfer } from "zod";
import type { calHeatScoreMetaSchema } from "./schemas/mod.ts";

/** The metadata returned from calheatscore/meta */
export type CalHeatScoreMeta = zinfer<typeof calHeatScoreMetaSchema>;
